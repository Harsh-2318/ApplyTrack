import type { ApplicationInput, JobApplication } from '@/types/application';
const isAws = process.env.NEXT_PUBLIC_APP_MODE === 'aws';
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new Error('AWS API URL is not configured. Set NEXT_PUBLIC_API_BASE_URL.');
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers } });
  if (!response.ok) { let message = 'Request failed. Please try again.'; try { const body = await response.json() as {message?: string}; message = body.message ?? message; } catch {} throw new Error(message); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  isAws,
  list: (token: string) => request<JobApplication[]>('/applications', token),
  create: (token: string, input: ApplicationInput) => request<JobApplication>('/applications', token, {method:'POST', body:JSON.stringify(input)}),
  update: (token: string, id: string, input: ApplicationInput) => request<JobApplication>(`/applications/${encodeURIComponent(id)}`, token, {method:'PUT',body:JSON.stringify(input)}),
  remove: (token: string, id: string) => request<void>(`/applications/${encodeURIComponent(id)}`, token, {method:'DELETE'}),
  authorizeResume: (token: string, file: {name:string;contentType:string;size:number}) => request<{uploadUrl:string;fields:Record<string,string>;resumeKey:string;expiresIn:number}>('/resume/presign', token, {method:'POST',body:JSON.stringify(file)})
};

