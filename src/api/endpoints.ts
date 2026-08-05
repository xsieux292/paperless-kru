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
  /** แบบฟอร์มที่เคยอัปโหลดไว้ ใช้ซ้ำได้ */
  formTemplates: {
    list: () => '/form-templates',
    detail: (templateId: string) => `/form-templates/${encodeURIComponent(templateId)}`,
    remove: (templateId: string) => `/form-templates/${encodeURIComponent(templateId)}`,
  },
  /** โครงการ / งบประมาณ */
  projects: {
    list: () => '/projects',
  },
  /** ระบบเบิกงบ / ยืมพัสดุ */
  requisitions: {
    list: () => '/requisitions',
    detail: (id: string) => `/requisitions/${encodeURIComponent(id)}`,
    create: () => '/requisitions',
    submit: (id: string) => `/requisitions/${encodeURIComponent(id)}/submit`,
    /** ให้ AI ช่วยคิดรายการอุปกรณ์จากคำอธิบายกิจกรรม */
    suggestItems: () => '/requisitions/suggest-items',
    approvers: () => '/requisitions/approvers',
  },
  /** AI ช่วยร่าง/เดาให้ก่อน เพื่อลดการกรอกของครู */
  ai: {
    draftRequisition: () => '/ai/draft-requisition',
    detectDocument: () => '/ai/detect-document',
    dailySummary: () => '/ai/daily-summary',
    portfolioCaption: () => '/ai/portfolio-caption',
  },
} as const;
