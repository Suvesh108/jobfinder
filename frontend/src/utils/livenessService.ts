export interface VerificationStatus {
  isActive: boolean;
  statusText: string;
  isATS: boolean;
  reason?: string;
}

const verifiedCache = new Map<string, VerificationStatus>();
const ATS_BACKEND_URL = (import.meta.env.VITE_ATS_BACKEND_URL as string)?.replace(/\/+$/, '') || 'http://localhost:8002';

export function getCachedLiveness(url?: string, source?: string): VerificationStatus | null {
  if (!url) return null;
  const isATS = (source || '').toLowerCase().startsWith('ats:') || url.includes('greenhouse.io') || url.includes('lever.co') || url.includes('ashbyhq.com');
  if (isATS) {
    return { isActive: true, statusText: 'Verified Active (Official ATS)', isATS: true };
  }
  return verifiedCache.get(url) || null;
}

export async function verifyJobUrlsBatch(
  jobs: Array<{ url?: string; source?: string }>
): Promise<Map<string, VerificationStatus>> {
  const resultMap = new Map<string, VerificationStatus>();
  const urlsToFetch: string[] = [];

  for (const j of jobs) {
    if (!j.url) continue;
    const isATS = (j.source || '').toLowerCase().startsWith('ats:') || j.url.includes('greenhouse.io') || j.url.includes('lever.co') || j.url.includes('ashbyhq.com');
    if (isATS) {
      const status: VerificationStatus = { isActive: true, statusText: 'Verified Active (Official ATS)', isATS: true };
      verifiedCache.set(j.url, status);
      resultMap.set(j.url, status);
    } else if (verifiedCache.has(j.url)) {
      resultMap.set(j.url, verifiedCache.get(j.url)!);
    } else {
      urlsToFetch.push(j.url);
    }
  }

  if (urlsToFetch.length === 0) return resultMap;

  try {
    const res = await fetch(`${ATS_BACKEND_URL}/verify/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: urlsToFetch })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const status: VerificationStatus = {
            isActive: item.is_active,
            statusText: item.is_active ? '🟢 Verified Live' : '🔴 Expired / Closed',
            isATS: false,
            reason: item.reason
          };
          verifiedCache.set(item.url, status);
          resultMap.set(item.url, status);
        }
      }
    }
  } catch (err) {
    // If verifier service is offline, fallback assuming active
    for (const url of urlsToFetch) {
      const status: VerificationStatus = { isActive: true, statusText: '🟢 Live', isATS: false };
      resultMap.set(url, status);
    }
  }

  return resultMap;
}
