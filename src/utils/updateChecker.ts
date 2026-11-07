import {
  CURRENT_APP_VERSION,
  OFFICIAL_GITHUB_REPO,
  AppUpdateInfo,
} from '../config/version';

const CUSTOM_REPO_STORAGE_KEY = 'supari_custom_github_repo';

/**
 * Extracts numeric parts from version strings like 'v2.0', '2.1.0-apk', etc.
 */
export function parseSemVer(vStr: string): number[] {
  const clean = vStr.replace(/^v/i, '').split('-')[0].trim();
  return clean.split('.').map((n) => parseInt(n, 10) || 0);
}

/**
 * Returns:
 *  1 if verA > verB
 * -1 if verA < verB
 *  0 if equal
 */
export function compareVersions(verA: string, verB: string): number {
  const a = parseSemVer(verA);
  const b = parseSemVer(verB);
  const maxLen = Math.max(a.length, b.length);

  for (let i = 0; i < maxLen; i++) {
    const valA = a[i] || 0;
    const valB = b[i] || 0;
    if (valA > valB) return 1;
    if (valA < valB) return -1;
  }
  return 0;
}

/**
 * Normalizes user input (handles full github.com/user/repo URLs or raw user/repo)
 */
export function cleanGitHubRepo(input: string): string {
  let clean = input.trim();
  clean = clean.replace(/^https?:\/\/github\.com\//i, '');
  clean = clean.replace(/^github\.com\//i, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

/**
 * Gets custom repository from localStorage if configured
 */
export function getCustomRepo(): string | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(CUSTOM_REPO_STORAGE_KEY);
  if (!val) return null;
  const cleaned = cleanGitHubRepo(val);
  // Auto-heal old misspelled repo so users never get stuck with 404
  if (cleaned.toLowerCase().includes('rahatsharif504')) {
    localStorage.removeItem(CUSTOM_REPO_STORAGE_KEY);
    return null;
  }
  return cleaned;
}

/**
 * Sets a custom GitHub repository
 */
export function setCustomRepo(repo: string): void {
  if (typeof window === 'undefined') return;
  const cleaned = cleanGitHubRepo(repo);
  if (!cleaned || cleaned.toLowerCase() === OFFICIAL_GITHUB_REPO.toLowerCase()) {
    localStorage.removeItem(CUSTOM_REPO_STORAGE_KEY);
  } else {
    localStorage.setItem(CUSTOM_REPO_STORAGE_KEY, cleaned);
  }
}

/**
 * One-click reset to official default repository
 */
export function resetToDefaultRepo(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CUSTOM_REPO_STORAGE_KEY);
}

/**
 * Checks if a custom repository is currently active
 */
export function isCustomRepoActive(): boolean {
  const custom = getCustomRepo();
  return Boolean(custom && custom.toLowerCase() !== OFFICIAL_GITHUB_REPO.toLowerCase());
}

/**
 * Returns the currently active GitHub repository (custom or official default)
 */
export function getTargetRepo(): string {
  const custom = getCustomRepo();
  return custom ? cleanGitHubRepo(custom) : OFFICIAL_GITHUB_REPO;
}

/**
 * Dynamic direct APK download URL based on active repository
 */
export function getTargetApkUrl(): string {
  const repo = getTargetRepo();
  return `https://github.com/${repo}/releases/latest/download/supari-calculator-offline.apk`;
}

/**
 * Dynamic Release page URL based on active repository
 */
export function getTargetReleaseUrl(): string {
  const repo = getTargetRepo();
  return `https://github.com/${repo}/releases/latest`;
}

/**
 * Directly triggers the Android APK download and update installation.
 */
export function installAppUpdate(apkUrl?: string): void {
  const targetUrl = apkUrl || getTargetApkUrl();
  if (typeof window !== 'undefined') {
    try {
      // In Android WebView / Capacitor, _system opens the native Android download manager / browser
      const systemWin = window.open(targetUrl, '_system');
      if (!systemWin) {
        window.location.href = targetUrl;
      }
    } catch {
      window.location.href = targetUrl;
    }
  }
}

/**
 * Automatically checks GitHub Releases and version.json for updates against the target repository.
 */
export async function checkForUpdates(overrideRepo?: string): Promise<AppUpdateInfo> {
  const repo = overrideRepo ? cleanGitHubRepo(overrideRepo) : getTargetRepo();
  const defaultApkUrl = `https://github.com/${repo}/releases/latest/download/supari-calculator-offline.apk`;
  const defaultReleaseUrl = `https://github.com/${repo}/releases/latest`;

  const defaultResult: AppUpdateInfo = {
    hasUpdate: false,
    latestVersion: CURRENT_APP_VERSION,
    currentVersion: CURRENT_APP_VERSION,
    downloadUrl: defaultReleaseUrl,
    apkUrl: defaultApkUrl,
  };

  if (!navigator.onLine) {
    return defaultResult;
  }

  try {
    // 1. Check official GitHub Releases API with cache-busting
    const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest?_t=${Date.now()}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (releaseRes.ok) {
      const data = await releaseRes.json();
      const rawTag = data.tag_name || data.name || '';
      const latestVer = rawTag.replace(/^v/i, '').split('-')[0].trim();

      if (compareVersions(latestVer, CURRENT_APP_VERSION) > 0) {
        let apkAssetUrl = defaultApkUrl;
        if (Array.isArray(data.assets)) {
          const found = data.assets.find((a: any) => a.name && a.name.endsWith('.apk'));
          if (found && found.browser_download_url) {
            apkAssetUrl = found.browser_download_url;
          }
        }

        return {
          hasUpdate: true,
          latestVersion: latestVer,
          currentVersion: CURRENT_APP_VERSION,
          releaseTitle: data.name || `ভার্সন ${latestVer}`,
          releaseNotes: data.body || 'নতুন ফিচার এবং উন্নতি যুক্ত করা হয়েছে।',
          downloadUrl: data.html_url || defaultReleaseUrl,
          apkUrl: apkAssetUrl,
        };
      }
      return defaultResult;
    }
  } catch {
    // Fallback to raw version.json
  }

  try {
    // 2. Fallback: Check raw version.json from GitHub
    const rawRes = await fetch(
      `https://raw.githubusercontent.com/${repo}/main/public/version.json?_t=${Date.now()}`
    );
    if (rawRes.ok) {
      const meta = await rawRes.json();
      const latestVer = (meta.version || '').replace(/^v/i, '').trim();

      if (latestVer && compareVersions(latestVer, CURRENT_APP_VERSION) > 0) {
        return {
          hasUpdate: true,
          latestVersion: latestVer,
          currentVersion: CURRENT_APP_VERSION,
          releaseTitle: meta.title || `ভার্সন ${latestVer}`,
          releaseNotes: meta.releaseNotes || 'নতুন আপডেট উপলব্ধ।',
          downloadUrl: meta.downloadUrl || defaultReleaseUrl,
          apkUrl: meta.apkUrl || defaultApkUrl,
        };
      }
    }
  } catch {
    // Network or server unreachable
  }

  return defaultResult;
}
