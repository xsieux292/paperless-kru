/**
 * รายการ endpoint ทั้งหมดของระบบ (ที่เดียว)
 * เวลาต่อ API จริง ให้แก้ path ที่นี่ที่เดียวพอ
 */
export const endpoints = {
  profile: {
    me: () => '/me',
  },
  jobs: {
    list: () => '/jobs',
    detail: (jobId: string) => `/jobs/${encodeURIComponent(jobId)}`,
    create: () => '/jobs',
    cancel: (jobId: string) => `/jobs/${encodeURIComponent(jobId)}/cancel`,
    retry: (jobId: string) => `/jobs/${encodeURIComponent(jobId)}/retry`,
    download: (jobId: string, fileId: string) =>
      `/jobs/${encodeURIComponent(jobId)}/files/${encodeURIComponent(fileId)}`,
  },
} as const;
