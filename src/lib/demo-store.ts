import type { JobApplication } from '@/types/application';
const seed: JobApplication[] = [
  {id:'demo-1',company:'Northstar Labs',jobTitle:'Junior Software Developer',location:'Bengaluru, India',applicationDate:'2026-10-21',status:'Interview',jobUrl:'https://example.com/jobs/1',notes:'Technical round scheduled. Review TypeScript and API design.',createdAt:'2026-10-21T10:00:00.000Z',updatedAt:'2026-10-23T10:00:00.000Z'},
  {id:'demo-2',company:'PixelCraft',jobTitle:'Frontend Developer Intern',location:'Remote',applicationDate:'2026-10-18',status:'Assessment',jobUrl:'https://example.com/jobs/2',notes:'Complete the UI assessment before Friday.',createdAt:'2026-10-18T10:00:00.000Z',updatedAt:'2026-10-19T10:00:00.000Z'},
  {id:'demo-3',company:'CloudPeak Systems',jobTitle:'Associate Engineer',location:'Hyderabad, India',applicationDate:'2026-10-14',status:'Applied',jobUrl:'https://example.com/jobs/3',notes:'Applied through the company careers page.',createdAt:'2026-10-14T10:00:00.000Z',updatedAt:'2026-10-14T10:00:00.000Z'},
  {id:'demo-4',company:'BrightBridge Tech',jobTitle:'Graduate Software Engineer',location:'Pune, India',applicationDate:'2026-10-08',status:'Offer',jobUrl:'https://example.com/jobs/4',notes:'Review compensation and joining details.',createdAt:'2026-10-08T10:00:00.000Z',updatedAt:'2026-10-24T10:00:00.000Z'},
  {id:'demo-5',company:'Orbit Digital',jobTitle:'React Developer',location:'Remote',applicationDate:'2026-10-02',status:'Rejected',jobUrl:'https://example.com/jobs/5',notes:'Ask for feedback if available.',createdAt:'2026-10-02T10:00:00.000Z',updatedAt:'2026-10-12T10:00:00.000Z'}
];
const KEY = 'applytrack-demo-applications-v1';
export function readDemoApplications(): JobApplication[] {
  if (typeof window === 'undefined') return seed;
  try { const raw = window.localStorage.getItem(KEY); return raw ? JSON.parse(raw) as JobApplication[] : seed; } catch { return seed; }
}
export function writeDemoApplications(items: JobApplication[]): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(items));
}
export function createDemoApplication(input: Omit<JobApplication, 'id'|'createdAt'|'updatedAt'>): JobApplication {
  const now = new Date().toISOString(); return { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}
