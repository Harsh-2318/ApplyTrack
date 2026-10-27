import { z } from 'zod';
import { APPLICATION_STATUSES } from '../types/application';
export const applicationSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(120),
  jobTitle: z.string().trim().min(1, 'Job title is required').max(120),
  location: z.string().trim().max(120).default(''),
  applicationDate: z.string().min(1, 'Application date is required'),
  status: z.enum(APPLICATION_STATUSES),
  jobUrl: z.string().trim().refine(v => !v || /^https?:\/\/.+/.test(v), 'Enter a valid http or https URL').default(''),
  notes: z.string().max(4000).default(''),
  resumeKey: z.string().optional(),
  resumeName: z.string().optional()
});
export type ApplicationFormValues = z.infer<typeof applicationSchema>;
export function validateResume(file: File): string | null {
  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.type)) return 'Only PDF and DOCX files are allowed.';
  if (file.size > 5 * 1024 * 1024) return 'Resume must be 5 MB or smaller.';
  if (file.size === 0) return 'The selected file is empty.';
  return null;
}
