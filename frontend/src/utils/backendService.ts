import { Capacitor, CapacitorHttp } from '@capacitor/core';

const STORAGE_KEY = 'jobfinder_backend_url';

export const isNativeMobile = (): boolean => {
  try {
    return (
      Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() === 'android' ||
      typeof (window as any).NativeUpdater !== 'undefined'
    );
  } catch {
    return false;
  }
};

export const getBackendUrl = (): string => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }

  const envUrl = (import.meta.env.VITE_PYTHON_BACKEND_URL as string)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  return 'http://localhost:8000';
};

export const setBackendUrl = (url: string): void => {
  try {
    const clean = url.trim().replace(/\/+$/, '');
    if (!clean) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, clean);
    }
  } catch (err) {
    console.error('Failed to save backend URL to localStorage:', err);
  }
};

export interface BackendResponse<T = any> {
  ok: boolean;
  status?: number;
  data?: T;
  error?: string;
}

export const fetchBackendJson = async <T = any>(
  endpoint: string,
  timeoutMs = 8000,
  urlOverride?: string
): Promise<BackendResponse<T>> => {
  const base = urlOverride ? urlOverride.trim().replace(/\/+$/, '') : getBackendUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${base}${cleanEndpoint}`;

  if (isNativeMobile()) {
    try {
      const res = await CapacitorHttp.get({
        url: fullUrl,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JobFinder-Mobile-Android',
        },
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });

      const ok = res.status >= 200 && res.status < 300;
      let parsedData = res.data;
      if (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch {
          // Keep as string if not JSON
        }
      }

      return {
        ok,
        status: res.status,
        data: ok ? (parsedData as T) : undefined,
        error: ok ? undefined : `HTTP status ${res.status}`,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message || 'Native network error',
      };
    }
  }

  // Web Browser fallback
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as T;
      return { ok: true, status: res.status, data };
    }
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      ok: false,
      error: err.name === 'AbortError' ? 'Connection timed out' : err.message || 'Fetch failed',
    };
  }
};

export const pingBackend = async (
  candidateUrl?: string
): Promise<{ ok: boolean; latencyMs?: number; version?: string; engine?: string; error?: string }> => {
  const start = performance.now();
  const res = await fetchBackendJson<{
    status?: string;
    version?: string;
    engine?: string;
  }>('/health', 4000, candidateUrl);

  const latencyMs = Math.round(performance.now() - start);

  if (res.ok && res.data) {
    return {
      ok: true,
      latencyMs,
      version: res.data.version || 'v0.4',
      engine: res.data.engine || 'JobScrap',
    };
  }

  return {
    ok: false,
    latencyMs,
    error: res.error || 'Server unreachable',
  };
};
