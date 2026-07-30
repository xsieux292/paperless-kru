import { env } from '@/config/env';

/**
 * HTTP client กลางของระบบ
 * - แปลง error ทุกชนิดให้เป็น ApiError ที่มีข้อความภาษาไทยอ่านง่าย
 * - มี timeout / abort
 * - รองรับ upload พร้อม progress (ผ่าน XMLHttpRequest)
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** ข้อความที่แสดงให้คุณครูเห็นได้เลย */
  readonly friendlyMessage: string;
  readonly details?: unknown;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    friendlyMessage?: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.friendlyMessage = params.friendlyMessage ?? friendlyMessageFor(params.status);
    this.details = params.details;
  }
}

function friendlyMessageFor(status: number): string {
  if (status === 0) return 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาตรวจสอบสัญญาณแล้วลองใหม่อีกครั้งค่ะ';
  if (status === 401 || status === 403) return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้งค่ะ';
  if (status === 404) return 'ไม่พบข้อมูลที่ต้องการ อาจถูกลบไปแล้วค่ะ';
  if (status === 408) return 'ระบบใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้งค่ะ';
  if (status === 413) return 'ไฟล์มีขนาดใหญ่เกินกำหนด กรุณาลดขนาดไฟล์แล้วลองใหม่ค่ะ';
  if (status === 429) return 'มีการใช้งานหนาแน่น กรุณารอสักครู่แล้วลองใหม่ค่ะ';
  if (status >= 500) return 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่ หรือติดต่อฝ่ายไอทีของโรงเรียนค่ะ';
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ';
}

/** ดึงข้อความ error จาก response แบบไม่พังถ้า body ไม่ใช่ JSON */
async function parseErrorBody(response: Response): Promise<{ code: string; message: string }> {
  try {
    const body = (await response.clone().json()) as {
      code?: string;
      message?: string;
      error?: string;
    };
    return {
      code: body.code ?? `HTTP_${response.status}`,
      message: body.message ?? body.error ?? response.statusText,
    };
  } catch {
    return { code: `HTTP_${response.status}`, message: response.statusText || 'Unknown error' };
  }
}

/** จุดเดียวสำหรับแนบ token — เปลี่ยนวิธีเก็บ token ได้ที่นี่ */
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** query string params */
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  /** ถ้า true จะไม่แนบ Content-Type (ใช้กับ FormData) */
  isFormData?: boolean;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = env.apiBaseUrl || '/api';
  const url = new URL(`${base}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, timeoutMs = env.apiTimeoutMs, isFormData, headers, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path, params), {
      ...rest,
      signal: options.signal ?? controller.signal,
      headers: {
        Accept: 'application/json',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...authHeaders(),
        ...headers,
      },
      body: isFormData ? (body as BodyInit) : body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const { code, message } = await parseErrorBody(response);
      throw new ApiError({ status: response.status, code, message });
    }

    if (response.status === 204) return undefined as T;

    const payload = (await response.json()) as T | { data: T };
    // รองรับทั้งแบบห่อ envelope { data } และแบบส่งตรง
    return payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data: T }).data
      : (payload as T);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError({ status: 408, code: 'TIMEOUT', message: 'Request timed out' });
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Network error',
      details: error,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

/**
 * อัปโหลดไฟล์พร้อมรายงานความคืบหน้า
 * ใช้ XMLHttpRequest เพราะ fetch ยังรายงาน upload progress ไม่ได้ในเบราว์เซอร์ทั่วไป
 */
export function uploadWithProgress<T>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', buildUrl(path));
    xhr.timeout = env.apiTimeoutMs;

    for (const [key, value] of Object.entries(authHeaders())) {
      xhr.setRequestHeader(key, value);
    }
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText || '{}');
          resolve(('data' in parsed ? parsed.data : parsed) as T);
        } catch {
          reject(
            new ApiError({ status: xhr.status, code: 'PARSE_ERROR', message: 'Invalid JSON' }),
          );
        }
      } else {
        reject(
          new ApiError({
            status: xhr.status,
            code: `HTTP_${xhr.status}`,
            message: xhr.statusText || 'Upload failed',
          }),
        );
      }
    };

    xhr.onerror = () =>
      reject(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Upload network error' }));
    xhr.ontimeout = () =>
      reject(new ApiError({ status: 408, code: 'TIMEOUT', message: 'Upload timed out' }));

    signal?.addEventListener('abort', () => xhr.abort());

    xhr.send(formData);
  });
}

/** แปลง error ใด ๆ ให้เป็นข้อความภาษาไทยที่แสดงให้ผู้ใช้เห็นได้ */
export function toFriendlyMessage(error: unknown): string {
  if (error instanceof ApiError) return error.friendlyMessage;
  if (error instanceof Error && error.message) return error.message;
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้งค่ะ';
}
