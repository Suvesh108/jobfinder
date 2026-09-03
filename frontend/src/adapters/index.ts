import { 
  instahyreAdapter,
  internshalaAdapter,
  shineAdapter,
  freshersworldAdapter,
  apnaAdapter,
  naukriAdapter, 
  indeedAdapter, 
  linkedinAdapter, 
  glassdoorAdapter 
} from './naukriIndeedAdapter';
import type { JobAdapter } from './types';

export const adapters: JobAdapter[] = [
  instahyreAdapter,
  naukriAdapter,
  internshalaAdapter,
  shineAdapter,
  freshersworldAdapter,
  apnaAdapter,
  indeedAdapter,
  linkedinAdapter,
  glassdoorAdapter,
];

export * from './types';
export type { JobStatus } from '../db/schema';
