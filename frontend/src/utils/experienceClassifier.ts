import type { JobListing } from '../adapters/types';

export interface ExperienceClassification {
  minYears: number;
  maxYears: number | null;
  level: 'fresher' | 'junior' | 'mid' | 'senior';
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export function classifyExperience(job: JobListing): ExperienceClassification {
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const fullText = `${title} ${desc}`;

  // 1. Explicit Year Range, e.g. "0-1 yrs", "0 to 2 years", "3-5 years", "5-8 yrs"
  const rangeMatch = fullText.match(/\b(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?|yr)\b/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (min === 0 || max <= 1) {
      return { minYears: min, maxYears: max, level: 'fresher', label: '🌱 Fresher (0-1 Yrs)', badgeBg: 'rgba(16, 185, 129, 0.15)', badgeText: '#34D399', badgeBorder: 'rgba(16, 185, 129, 0.35)' };
    }
    if (min <= 2) {
      return { minYears: min, maxYears: max, level: 'junior', label: '⚡ Junior (1-3 Yrs)', badgeBg: 'rgba(56, 189, 248, 0.15)', badgeText: '#38BDF8', badgeBorder: 'rgba(56, 189, 248, 0.35)' };
    }
    if (min <= 5) {
      return { minYears: min, maxYears: max, level: 'mid', label: '💼 Mid-Level (3-5 Yrs)', badgeBg: 'rgba(168, 85, 247, 0.15)', badgeText: '#C084FC', badgeBorder: 'rgba(168, 85, 247, 0.35)' };
    }
    return { minYears: min, maxYears: max, level: 'senior', label: '👑 Senior (5+ Yrs)', badgeBg: 'rgba(245, 158, 11, 0.15)', badgeText: '#FBBF24', badgeBorder: 'rgba(245, 158, 11, 0.35)' };
  }

  // 2. Minimum Years Plus, e.g. "2+ years", "3+ yrs", "5+ years"
  const plusMatch = fullText.match(/\b(\d+)\s*\+\s*(?:years?|yrs?|yr)\b/i);
  if (plusMatch) {
    const min = parseInt(plusMatch[1], 10);
    if (min <= 1) {
      return { minYears: min, maxYears: null, level: 'fresher', label: '🌱 Fresher (0-1 Yrs)', badgeBg: 'rgba(16, 185, 129, 0.15)', badgeText: '#34D399', badgeBorder: 'rgba(16, 185, 129, 0.35)' };
    }
    if (min <= 3) {
      return { minYears: min, maxYears: null, level: 'junior', label: '⚡ Junior (1-3 Yrs)', badgeBg: 'rgba(56, 189, 248, 0.15)', badgeText: '#38BDF8', badgeBorder: 'rgba(56, 189, 248, 0.35)' };
    }
    if (min <= 5) {
      return { minYears: min, maxYears: null, level: 'mid', label: '💼 Mid-Level (3-5 Yrs)', badgeBg: 'rgba(168, 85, 247, 0.15)', badgeText: '#C084FC', badgeBorder: 'rgba(168, 85, 247, 0.35)' };
    }
    return { minYears: min, maxYears: null, level: 'senior', label: '👑 Senior (5+ Yrs)', badgeBg: 'rgba(245, 158, 11, 0.15)', badgeText: '#FBBF24', badgeBorder: 'rgba(245, 158, 11, 0.35)' };
  }

  // 3. Keyword Detection in Title / Description
  if (/\b(fresher|freshers|graduate trainee|trainee|entry[\s-]?level|0[\s-]?(?:years?|exp)|intern|internship|campus hiring)\b/i.test(fullText)) {
    return { minYears: 0, maxYears: 1, level: 'fresher', label: '🌱 Fresher (0-1 Yrs)', badgeBg: 'rgba(16, 185, 129, 0.15)', badgeText: '#34D399', badgeBorder: 'rgba(16, 185, 129, 0.35)' };
  }
  if (/\b(senior|sr\.|lead|principal|architect|staff|director|head of)\b/i.test(title)) {
    return { minYears: 5, maxYears: null, level: 'senior', label: '👑 Senior (5+ Yrs)', badgeBg: 'rgba(245, 158, 11, 0.15)', badgeText: '#FBBF24', badgeBorder: 'rgba(245, 158, 11, 0.35)' };
  }
  if (/\b(associate|junior|jr\.|sde[\s-]?1|software engineer[\s-]?1)\b/i.test(title)) {
    return { minYears: 1, maxYears: 3, level: 'junior', label: '⚡ Junior (1-3 Yrs)', badgeBg: 'rgba(56, 189, 248, 0.15)', badgeText: '#38BDF8', badgeBorder: 'rgba(56, 189, 248, 0.35)' };
  }
  if (/\b(sde[\s-]?2|software engineer[\s-]?2|mid[\s-]?level)\b/i.test(title)) {
    return { minYears: 3, maxYears: 5, level: 'mid', label: '💼 Mid-Level (3-5 Yrs)', badgeBg: 'rgba(168, 85, 247, 0.15)', badgeText: '#C084FC', badgeBorder: 'rgba(168, 85, 247, 0.35)' };
  }

  // Default: Junior / Early Career
  return { minYears: 0, maxYears: 2, level: 'junior', label: '⚡ 0-2 Yrs Exp', badgeBg: 'rgba(148, 163, 184, 0.15)', badgeText: '#94A3B8', badgeBorder: 'rgba(148, 163, 184, 0.35)' };
}
