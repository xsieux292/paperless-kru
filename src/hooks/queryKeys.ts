/** รวม query key ทั้งหมดไว้ที่เดียว กัน key ชนกันและ invalidate ผิดตัว */
export const queryKeys = {
  profile: ['profile'] as const,
  jobs: {
    all: ['jobs'] as const,
    list: () => [...queryKeys.jobs.all, 'list'] as const,
    detail: (jobId: string) => [...queryKeys.jobs.all, 'detail', jobId] as const,
  },
};
