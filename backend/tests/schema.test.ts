import { describe, expect, it } from 'vitest';
import { parseApplication } from '../src/shared/schema.js';
const good={company:'Acme',jobTitle:'Engineer',location:'Remote',applicationDate:'2026-10-28',status:'Applied',jobUrl:'https://example.com',notes:'hello'};
describe('backend request validation',()=>{it('accepts valid payloads',()=>{expect(parseApplication(good).company).toBe('Acme');});it('rejects empty company',()=>{expect(()=>parseApplication({...good,company:''})).toThrow('VALIDATION:');});it('rejects unsafe URLs',()=>{expect(()=>parseApplication({...good,jobUrl:'javascript:alert(1)'})).toThrow('VALIDATION:');});it('rejects invalid dates',()=>{expect(()=>parseApplication({...good,applicationDate:'yesterday'})).toThrow('VALIDATION:');});});
