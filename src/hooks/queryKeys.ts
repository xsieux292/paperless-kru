/** รวม query key ทั้งหมดไว้ที่เดียว กัน key ชนกันและ invalidate ผิดตัว */
export const queryKeys = {
  profile: ['profile'] as const,
  jobs: {
    all: ['jobs'] as const,
    list: () => [...queryKeys.jobs.all, 'list'] as const,
    detail: (jobId: string) => [...queryKeys.jobs.all, 'detail', jobId] as const,
  },
  formTemplates: {
    all: ['form-templates'] as const,
    list: () => [...queryKeys.formTemplates.all, 'list'] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
  },
  approvers: {
    all: ['approvers'] as const,
    list: () => [...queryKeys.approvers.all, 'list'] as const,
  },
  requisitions: {
    all: ['requisitions'] as const,
    list: () => [...queryKeys.requisitions.all, 'list'] as const,
  },
};
