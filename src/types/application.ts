export const APPLICATION_STATUSES = ['Applied', 'Interview', 'Assessment', 'Offer', 'Rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type JobApplication = {
  id: string;
  userId?: string;
  company: string;
  jobTitle: string;
  location: string;
  applicationDate: string;
  status: ApplicationStatus;
  jobUrl: string;
  notes: string;
  resumeKey?: string;
  resumeName?: string;
  createdAt: string;
  updatedAt: string;
};
export type ApplicationInput = Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
