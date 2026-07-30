/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MOCK?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_JOB_POLL_INTERVAL_MS?: string;
  readonly VITE_MAX_FILE_SIZE_MB?: string;
  readonly VITE_MAX_FILE_COUNT?: string;
  readonly VITE_SUPPORT_PHONE?: string;
  readonly VITE_SUPPORT_PHONE_HREF?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
