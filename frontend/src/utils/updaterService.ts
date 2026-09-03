export interface ReleaseInfo {
  tag: string;
  name: string;
  body: string;
  publishedAt: string;
  apkDownloadUrl?: string;
  apkFileName?: string;
  apkSizeMb?: string;
  htmlUrl: string;
}

export const CURRENT_APP_VERSION = 'v1.1.7';

export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  try {
    const res = await fetch('https://api.github.com/repos/Suvesh108/jobfinder/releases/latest');
    if (!res.ok) throw new Error('Failed to fetch release from GitHub');
    const data = await res.json();
    
    let apkAsset = data.assets?.find((a: any) => a.name && a.name.endsWith('.apk') && a.name.toLowerCase().includes('jobfinder'));
    if (!apkAsset && data.assets?.length > 0) {
      apkAsset = data.assets.find((a: any) => a.name && a.name.endsWith('.apk'));
    }

    const apkDownloadUrl = apkAsset?.browser_download_url || `https://github.com/Suvesh108/jobfinder/releases/download/${data.tag_name || CURRENT_APP_VERSION}/JobFinder-${data.tag_name || CURRENT_APP_VERSION}.apk`;
    const apkFileName = apkAsset?.name || `JobFinder-${data.tag_name || CURRENT_APP_VERSION}.apk`;
    const apkSizeMb = apkAsset?.size ? (apkAsset.size / (1024 * 1024)).toFixed(2) + ' MB' : '~4.9 MB';

    return {
      tag: data.tag_name || CURRENT_APP_VERSION,
      name: data.name || `JobFinder ${data.tag_name || CURRENT_APP_VERSION}`,
      body: data.body || '',
      publishedAt: data.published_at || new Date().toISOString(),
      apkDownloadUrl,
      apkFileName,
      apkSizeMb,
      htmlUrl: data.html_url || 'https://github.com/Suvesh108/jobfinder/releases'
    };
  } catch (err) {
    return {
      tag: CURRENT_APP_VERSION,
      name: `JobFinder ${CURRENT_APP_VERSION}`,
      body: 'Latest stable release with in-app native OTA installer and fast parallel portal scanner.',
      publishedAt: new Date().toISOString(),
      apkDownloadUrl: `https://github.com/Suvesh108/jobfinder/releases/download/${CURRENT_APP_VERSION}/JobFinder-${CURRENT_APP_VERSION}.apk`,
      apkFileName: `JobFinder-${CURRENT_APP_VERSION}.apk`,
      apkSizeMb: '~4.9 MB',
      htmlUrl: 'https://github.com/Suvesh108/jobfinder/releases'
    };
  }
}

export async function fetchJobScrapVersion(): Promise<{ installed: string; latest: string; isLatest: boolean }> {
  try {
    const res = await fetch('https://api.github.com/repos/Suvesh108/jobscrap/commits?per_page=1');
    if (!res.ok) throw new Error('GitHub unreachable');
    const data = await res.json();
    const latest = data[0]?.sha?.substring(0, 7) || 'v1.0.0';
    return {
      installed: 'v1.0.0 (Local Active)',
      latest: `v1.0.0 (${latest})`,
      isLatest: true
    };
  } catch (err) {
    return {
      installed: 'v1.0.0 (Active)',
      latest: 'v1.0.0',
      isLatest: true
    };
  }
}

export const fetchJobSpyVersion = fetchJobScrapVersion;

/**
 * Downloads and triggers package installation 100% inside the app without opening Chrome.
 */
export async function downloadApkInternally(
  downloadUrl: string,
  fileName: string,
  onProgress?: (progress: number, loadedMb: string, totalMb: string) => void
): Promise<{ success: boolean; blobUrl?: string }> {
  // If running inside Android native container, use the NativeUpdater interface
  if (typeof (window as any).NativeUpdater?.downloadAndInstall === 'function') {
    return new Promise((resolve) => {
      (window as any).__onNativeUpdateProgress = (pct: number, loaded: string, total: string) => {
        if (onProgress) onProgress(pct, loaded, total);
      };
      (window as any).__onNativeUpdateComplete = () => {
        if (onProgress) onProgress(100, '4.9', '4.9');
        resolve({ success: true });
      };
      (window as any).__onNativeUpdateError = (err: string) => {
        console.error('[NativeUpdater Error]', err);
        resolve({ success: false });
      };

      (window as any).NativeUpdater.downloadAndInstall(downloadUrl, fileName);
    });
  }

  // Fallback in web/desktop environment
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 4.9 * 1024 * 1024;
    let receivedBytes = 0;

    let blob: Blob;

    if (response.body && response.body.getReader) {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
          const loadedMb = (receivedBytes / (1024 * 1024)).toFixed(1);
          const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
          if (onProgress) onProgress(pct, loadedMb, totalMb);
        }
      }

      blob = new Blob(chunks as BlobPart[], { type: 'application/vnd.android.package-archive' });
    } else {
      blob = await response.blob();
    }

    if (onProgress) onProgress(100, (totalBytes / (1024 * 1024)).toFixed(1), (totalBytes / (1024 * 1024)).toFixed(1));

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 2000);

    return { success: true, blobUrl };
  } catch (err) {
    console.error('[Updater] Download error:', err);
    return { success: false };
  }
}


export interface JobScrapOTAStatus {
  hasUpdate: boolean;
  installed: {
    version: string;
    commit: string;
    shortCommit: string;
    date: string;
    message: string;
  };
  latest: {
    version: string;
    commit: string;
    shortCommit: string;
    date: string;
    message: string;
  };
  error?: string;
}

export async function checkJobScrapOTAUpdate(): Promise<JobScrapOTAStatus> {
  const backendUrl = (import.meta.env.VITE_PYTHON_BACKEND_URL as string)?.replace(/\/+$/, '') || 'http://localhost:8000';
  
  // 1. Try local backend OTA endpoint
  try {
    const res = await fetch(`${backendUrl}/updater/check`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  // 2. Fallback direct to GitHub commits API
  try {
    const res = await fetch('https://api.github.com/repos/Suvesh108/jobscrap/commits/main');
    if (!res.ok) throw new Error('GitHub unreachable');
    const data = await res.json();
    const sha = data.sha || '8331be0f5b20d0c4b5b439960146c7e1a010a0cd';
    const msg = data.commit?.message?.split('\n')[0] || 'Release v0.2';
    const date = data.commit?.committer?.date?.substring(0, 10) || '2026-09-03';

    return {
      hasUpdate: false,
      installed: {
        version: 'v0.2',
        commit: '8331be0f5b20d0c4b5b439960146c7e1a010a0cd',
        shortCommit: '8331be0',
        date: '2026-09-03',
        message: 'docs: bump release to v0.2 with frontend search & soft-404 highlights'
      },
      latest: {
        version: 'v0.2',
        commit: sha,
        shortCommit: sha.substring(0, 7),
        date,
        message: msg
      }
    };
  } catch (err) {
    return {
      hasUpdate: false,
      installed: {
        version: 'v0.2',
        commit: '8331be0',
        shortCommit: '8331be0',
        date: '2026-09-03',
        message: 'JobScrap v0.2'
      },
      latest: {
        version: 'v0.2',
        commit: '8331be0',
        shortCommit: '8331be0',
        date: '2026-09-03',
        message: 'JobScrap v0.2'
      },
      error: (err as Error).message
    };
  }
}

export async function triggerJobScrapOTAUpdate(): Promise<{ success: boolean; message: string; version?: any }> {
  const backendUrl = (import.meta.env.VITE_PYTHON_BACKEND_URL as string)?.replace(/\/+$/, '') || 'http://localhost:8000';
  const res = await fetch(`${backendUrl}/updater/update`, {
    method: 'POST'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'OTA Update failed');
  }
  return await res.json();
}
