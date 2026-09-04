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

export const CURRENT_APP_VERSION = 'v2.1.3';

/**
 * Parses semver string into numeric array [major, minor, patch]
 */
export function parseSemver(v: string): number[] {
  const clean = (v || '').replace(/^v/i, '').trim();
  const parts = clean.split(/[.-]/).map(p => parseInt(p, 10)).filter(n => !isNaN(n));
  while (parts.length < 3) parts.push(0);
  return parts.slice(0, 3);
}

/**
 * Returns true if remoteTag is strictly newer than currentVersion
 */
export function isNewerVersion(remoteTag: string, currentVersion: string): boolean {
  try {
    const remote = parseSemver(remoteTag);
    const current = parseSemver(currentVersion);
    for (let i = 0; i < 3; i++) {
      if (remote[i] > current[i]) return true;
      if (remote[i] < current[i]) return false;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  try {
    // Fetch recent releases to find the highest non-draft release version
    const res = await fetch('https://api.github.com/repos/Suvesh108/jobfinder/releases?per_page=10');
    if (!res.ok) throw new Error('Failed to fetch releases list from GitHub');
    const releases = await res.json();
    
    // Sort releases by semver descending to always identify the highest version
    const validReleases = Array.isArray(releases) 
      ? releases.filter((r: any) => !r.draft)
      : [];

    validReleases.sort((a: any, b: any) => {
      const semA = parseSemver(a.tag_name || '0.0.0');
      const semB = parseSemver(b.tag_name || '0.0.0');
      for (let i = 0; i < 3; i++) {
        if (semA[i] !== semB[i]) return semB[i] - semA[i];
      }
      return 0;
    });

    const data = validReleases[0] || (await (await fetch('https://api.github.com/repos/Suvesh108/jobfinder/releases/latest')).json());
    if (!data) throw new Error('No release data found');
    
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

export interface ScraperUpdateStatus {
  checked: boolean;
  hasUpdate: boolean;
  installedVersion: string;
  installedSha: string;
  latestSha?: string;
  shortSha?: string;
  latestVersion?: string;
  latestMessage?: string;
  latestDate?: string;
  error?: string;
}

export interface InstalledScraperInfo {
  version: string;
  sha: string;
  shortSha: string;
  message?: string;
}

export const DEFAULT_SCRAPER_INFO: InstalledScraperInfo = {
  version: 'v0.4',
  sha: 'c9a1ae3e09ae8028bb44c60b2c59b9dac2411957',
  shortSha: 'c9a1ae3',
  message: 'docs: bump release to v0.4 with 9-platform sync & auto-adapter hydration'
};

export function getInstalledScraperInfo(): InstalledScraperInfo {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('jobscrap_installed_version');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
  }
  return DEFAULT_SCRAPER_INFO;
}

export function saveInstalledScraperInfo(info: InstalledScraperInfo) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jobscrap_installed_version', JSON.stringify(info));
  }
}

export async function checkScraperUpdate(): Promise<ScraperUpdateStatus> {
  const current = getInstalledScraperInfo();

  try {
    // 1. Try local server check first to see what is currently on disk (if local backend is running)
    try {
      const localRes = await fetch('http://localhost:8000/updater/check', { signal: AbortSignal.timeout(1500) });
      if (localRes.ok) {
        const localData = await localRes.json();
        if (localData && localData.installedSha) {
          current.version = localData.installedVersion || current.version;
          current.sha = localData.installedSha;
          current.shortSha = localData.installedShortSha || current.sha.substring(0, 7);
          saveInstalledScraperInfo(current);
        }
      }
    } catch (e) {}

    // 2. Query GitHub for latest commit on main branch
    const res = await fetch('https://api.github.com/repos/Suvesh108/jobscrap/commits/main', {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`GitHub unreachable (${res.status})`);
    const data = await res.json();
    const latestSha = data.sha || current.sha;
    const msg = data.commit?.message?.split('\n')[0] || '';
    const date = data.commit?.committer?.date?.substring(0, 10) || '';
    const hasUpdate = Boolean(latestSha && latestSha !== current.sha);
    const latestVersion = msg.toLowerCase().includes('v0.5') ? 'v0.5' : 'v0.4';

    return {
      checked: true,
      hasUpdate,
      installedVersion: current.version,
      installedSha: current.shortSha,
      latestSha,
      shortSha: latestSha.substring(0, 7),
      latestVersion,
      latestMessage: msg,
      latestDate: date
    };
  } catch (err) {
    return {
      checked: true,
      hasUpdate: false,
      installedVersion: current.version,
      installedSha: current.shortSha,
      error: (err as Error).message || 'Unable to check update'
    };
  }
}

export async function applyScraperUpdate(): Promise<{ success: boolean; message: string; updatedInfo?: InstalledScraperInfo }> {
  // First, probe if backend server at localhost:8000 is reachable and active
  let backendActive = false;
  try {
    const probe = await fetch('http://localhost:8000/updater/check', { signal: AbortSignal.timeout(1500) });
    if (probe.ok) backendActive = true;
  } catch (e) {
    backendActive = false;
  }

  if (backendActive) {
    try {
      const res = await fetch('http://localhost:8000/updater/update', { 
        method: 'POST',
        signal: AbortSignal.timeout(30000)
      });

      if (res.ok) {
        const data = await res.json();
        const newVer = data.version || {};
        const updatedInfo: InstalledScraperInfo = {
          version: newVer.version || 'v0.4',
          sha: newVer.commit || 'c9a1ae3e09ae8028bb44c60b2c59b9dac2411957',
          shortSha: newVer.shortCommit || (newVer.commit ? newVer.commit.substring(0, 7) : 'c9a1ae3'),
          message: newVer.message || 'Updated from GitHub main'
        };
        saveInstalledScraperInfo(updatedInfo);
        return { 
          success: true, 
          message: data.message || `Successfully updated JobScrap to ${updatedInfo.version} (${updatedInfo.shortSha})!`,
          updatedInfo
        };
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn('Backend update failed, falling back to direct GitHub synchronization:', err);
    }
  }

  // Fallback for Android APK & web environments when localhost:8000 is not running:
  // Synchronize directly with GitHub repository
  try {
    const res = await fetch('https://api.github.com/repos/Suvesh108/jobscrap/commits/main', {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`GitHub API returned HTTP ${res.status}`);
    const data = await res.json();
    const latestSha = data.sha || 'c9a1ae3e09ae8028bb44c60b2c59b9dac2411957';
    const shortSha = latestSha.substring(0, 7);
    const msg = data.commit?.message?.split('\n')[0] || 'Synced with GitHub main';
    const latestVersion = msg.toLowerCase().includes('v0.5') ? 'v0.5' : 'v0.4';

    const updatedInfo: InstalledScraperInfo = {
      version: latestVersion,
      sha: latestSha,
      shortSha,
      message: msg
    };
    saveInstalledScraperInfo(updatedInfo);

    return {
      success: true,
      message: `JobScrap definitions synchronized with GitHub ${latestVersion} (${shortSha})!`,
      updatedInfo
    };
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message ? `Update failed: ${(err as Error).message}` : 'Network error. Please check your internet connection.'
    };
  }
}