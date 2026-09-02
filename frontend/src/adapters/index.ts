import { 
  naukriAdapter, 
  indeedAdapter, 
  linkedinAdapter, 
  glassdoorAdapter, 
  zipRecruiterAdapter 
} from './naukriIndeedAdapter';
import {
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter
} from './atsAdapter';
import type { JobAdapter } from './types';

export const adapters: JobAdapter[] = [
  naukriAdapter,
  indeedAdapter,
  linkedinAdapter,
  glassdoorAdapter,
  zipRecruiterAdapter,
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
];

export * from './types';
export type { JobStatus } from '../db/schema';
