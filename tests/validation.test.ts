import { describe, expect, it } from 'vitest';
import { applicationSchema, validateResume } from '../src/lib/validation';
const valid={company:'Example Co',jobTitle:'Junior Developer',location:'Remote',applicationDate:'2026-10-28',status:'Applied',jobUrl:'https://example.com/jobs/1',notes:'Follow up next week'};
describe('application validation',()=>{
 it('accepts a valid application',()=>{expect(applicationSchema.safeParse(valid).success).toBe(true);});
 it('requires a company name',()=>{expect(applicationSchema.safeParse({...valid,company:'  '}).success).toBe(false);});
 it('rejects non-http job URLs',()=>{expect(applicationSchema.safeParse({...valid,jobUrl:'javascript:alert(1)'}).success).toBe(false);});
 it('rejects unsupported statuses',()=>{expect(applicationSchema.safeParse({...valid,status:'Pending'}).success).toBe(false);});
});
describe('resume validation',()=>{
 it('accepts PDF under 5 MB',()=>{expect(validateResume(new File(['resume'],'cv.pdf',{type:'application/pdf'}))).toBeNull();});
 it('rejects unsupported file types',()=>{expect(validateResume(new File(['hello'],'cv.txt',{type:'text/plain'}))).toContain('Only PDF and DOCX');});
 it('rejects files over 5 MB',()=>{const file=new File([new Uint8Array(5*1024*1024+1)],'cv.pdf',{type:'application/pdf'});expect(validateResume(file)).toContain('5 MB');});
});
