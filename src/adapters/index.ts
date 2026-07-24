import { naukriAdapter, indeedAdapter, glassdoorAdapter } from './naukriIndeedAdapter';
import { linkedinAdapter } from './linkedinAdapter';
import { internshalaAdapter } from './internshalaAdapter';
import type { JobAdapter } from './types';

export const adapters: JobAdapter[] = [
  naukriAdapter,
  indeedAdapter,
  linkedinAdapter,
  glassdoorAdapter,
  internshalaAdapter,
];

export * from './types';
export type { JobStatus } from '../db/schema';
