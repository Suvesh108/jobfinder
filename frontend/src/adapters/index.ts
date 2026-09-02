import { 
  naukriAdapter, 
  indeedAdapter, 
  linkedinAdapter, 
  glassdoorAdapter, 
  zipRecruiterAdapter 
} from './naukriIndeedAdapter';
import type { JobAdapter } from './types';

export const adapters: JobAdapter[] = [
  naukriAdapter,
  indeedAdapter,
  linkedinAdapter,
  glassdoorAdapter,
  zipRecruiterAdapter,
];

export * from './types';
export type { JobStatus } from '../db/schema';
