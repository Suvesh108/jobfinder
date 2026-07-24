import type { JobListing } from '../adapters/types';

// Extract lowercase words from string, ignoring punctuation
const getTokens = (str: string): string[] => {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // remove punctuation
    .split(/\s+/)
    .filter(Boolean);
};

// Normalize typical Indian aliases for high accuracy
const normalizeText = (text: string): string => {
  if (!text) return '';
  let val = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // remove punctuation
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim();

  // Company Aliases
  if (val.includes('tata consultancy services') || val === 'tcs') {
    val = 'tcs';
  } else if (val.includes('wipro')) {
    val = 'wipro';
  } else if (val.includes('infosys')) {
    val = 'infosys';
  } else if (val.includes('cognizant') || val.includes('cts')) {
    val = 'cognizant';
  } else if (val.includes('tech mahindra')) {
    val = 'tech mahindra';
  } else if (val.includes('hcl')) {
    val = 'hcl';
  }

  // Location Aliases
  if (val.includes('bangalore') || val.includes('bengaluru')) {
    val = 'bengaluru';
  } else if (val.includes('bombay') || val.includes('mumbai')) {
    val = 'mumbai';
  } else if (val.includes('delhi') || val.includes('ncr') || val.includes('gurgaon') || val.includes('noida')) {
    val = 'delhi ncr';
  }

  return val;
};

// Jaccard similarity on tokens
const calculateJaccardSimilarity = (str1: string, str2: string): number => {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  const t1 = new Set(getTokens(norm1));
  const t2 = new Set(getTokens(norm2));

  if (t1.size === 0 && t2.size === 0) return 1;

  const intersection = new Set([...t1].filter(x => t2.has(x)));
  const union = new Set([...t1, ...t2]);

  return intersection.size / union.size;
};

// Rate completeness of data: description length, salary specification
const getCompletenessScore = (job: JobListing): number => {
  let score = 0;
  if (job.description && job.description.length > 50) score += 3;
  if (job.salary && job.salary !== 'Not Specified' && job.salary.trim() !== '') score += 2;
  if (job.url) score += 1;
  return score;
};

// Unified deduplication engine
export const dedupeJobs = (listings: JobListing[]): JobListing[] => {
  const deduplicated: JobListing[] = [];

  for (const newJob of listings) {
    let duplicateIndex = -1;

    for (let i = 0; i < deduplicated.length; i++) {
      const existingJob = deduplicated[i];

      // Rule A: Exact URL match
      if (newJob.url && existingJob.url && newJob.url === existingJob.url) {
        duplicateIndex = i;
        break;
      }

      // Rule B: Fuzzy Match on Company + Role + Location (threshold 0.85)
      const keyNew = `${newJob.company} ${newJob.title} ${newJob.location}`;
      const keyExisting = `${existingJob.company} ${existingJob.title} ${existingJob.location}`;
      
      const similarity = calculateJaccardSimilarity(keyNew, keyExisting);
      if (similarity >= 0.85) {
        duplicateIndex = i;
        break;
      }
    }

    if (duplicateIndex !== -1) {
      // Duplicate found! Compare data completeness
      const existingJob = deduplicated[duplicateIndex];
      const existingScore = getCompletenessScore(existingJob);
      const newScore = getCompletenessScore(newJob);

      // Collect cross-posting sources
      const mergedSources = new Set([
        existingJob.source,
        newJob.source,
        ...(existingJob.alsoOn || []),
        ...(newJob.alsoOn || []),
      ]);

      if (newScore > existingScore) {
        // Keep newJob, but remember it was also on existingJob's source
        const replacement = { ...newJob };
        
        // Remove current source from the "alsoOn" list
        mergedSources.delete(newJob.source);
        
        replacement.alsoOn = Array.from(mergedSources);
        deduplicated[duplicateIndex] = replacement;
      } else {
        // Retain existingJob, but append newJob's source to alsoOn list
        mergedSources.delete(existingJob.source);
        existingJob.alsoOn = Array.from(mergedSources);
      }
    } else {
      // No duplicate found: add to final list
      deduplicated.push({ ...newJob, alsoOn: [] });
    }
  }

  return deduplicated;
};
