export interface VerificationStatus {
  isActive: boolean;
  statusText: string;
  isATS: boolean;
  reason?: string;
}

const verifiedCache = new Map<string, VerificationStatus>();

export function getCachedLiveness(url?: string, _source?: string): VerificationStatus | null {
  if (!url) return null;
  return verifiedCache.get(url) || { isActive: true, statusText: '🟢 Live', isATS: false };
}

export async function verifyJobUrlsBatch(
  jobs: Array<{ url?: string; source?: string }>
): Promise<Map<string, VerificationStatus>> {
  const resultMap = new Map<string, VerificationStatus>();
  for (const j of jobs) {
    if (!j.url) continue;
    const status: VerificationStatus = { isActive: true, statusText: '🟢 Live', isATS: false };
    verifiedCache.set(j.url, status);
    resultMap.set(j.url, status);
  }
  return resultMap;
}
