export const CURRENT_VERSION = '1.0.5';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  title: string;
  highlights: string[];
  githubReleaseUrl?: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseInfo?: VersionInfo;
  error?: string;
}

/**
 * Compare two semver version strings (e.g. "1.1.0" vs "1.0.0")
 * Returns:
 *  1 if v1 > v2
 * -1 if v1 < v2
 *  0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const cleanV1 = v1.replace(/^v/i, '').trim();
  const cleanV2 = v2.replace(/^v/i, '').trim();

  const parts1 = cleanV1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = cleanV2.split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Checks for updates by querying version.json with cache buster
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const timestamp = Date.now();
  // Support both root domain and subfolder base url
  const versionUrl = `${import.meta.env.BASE_URL || './'}version.json?_t=${timestamp}`;

  try {
    const response = await fetch(versionUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined,
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} failed to fetch version`);
    }

    const info: VersionInfo = await response.json();
    const hasUpdate = compareSemver(info.version, CURRENT_VERSION) > 0;

    return {
      hasUpdate,
      currentVersion: CURRENT_VERSION,
      latestVersion: info.version,
      releaseInfo: info,
    };
  } catch (err: any) {
    console.warn('Update check failed:', err);
    return {
      hasUpdate: false,
      currentVersion: CURRENT_VERSION,
      latestVersion: CURRENT_VERSION,
      error: err.message || '网络检查异常',
    };
  }
}

/**
 * Perform online update reload
 */
export async function applyOnlineUpdate(): Promise<void> {
  try {
    // Clear browser caches if CacheStorage is available
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn('Failed to clear cache storage:', e);
  }

  // Force hard reload by appending timestamp
  const url = new URL(window.location.href);
  url.searchParams.set('_reload', Date.now().toString());
  window.location.href = url.toString();
}
