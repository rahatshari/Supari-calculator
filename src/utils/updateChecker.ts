import { CURRENT_APP_VERSION, DEFAULT_GITHUB_REPO, AppUpdateInfo } from '../config/version';

/**
 * Extracts numeric parts from version strings like 'v1.0.1', '1.2.0-apk', etc.
 */
export function parseSemVer(vStr: string): number[] {
  const clean = vStr.replace(/^v/i, '').split('-')[0].trim();
  return clean.split('.').map(n => parseInt(n, 10) || 0);
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

export function getTargetRepo(): string {
  try {
    const saved = localStorage.getItem('custom_github_repo');
    if (saved && saved.trim()) return saved.trim();

    // Auto-detect if running on GitHub Pages: e.g. username.github.io/reponame
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
      const user = window.location.hostname.split('.')[0];
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (user && pathParts.length > 0) {
        return `${user}/${pathParts[0]}`;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_GITHUB_REPO;
}

export function setTargetRepo(repo: string): void {
  try {
    localStorage.setItem('custom_github_repo', repo.trim());
  } catch {
    // Ignore storage errors
  }
}

/**
 * Checks GitHub Releases and raw version.json for updates.
 */
export async function checkForUpdates(force = false): Promise<AppUpdateInfo> {
  const defaultResult: AppUpdateInfo = {
    hasUpdate: false,
    latestVersion: CURRENT_APP_VERSION,
    currentVersion: CURRENT_APP_VERSION,
  };

  if (!navigator.onLine) {
    return defaultResult;
  }

  const repo = getTargetRepo();

  try {
    // 1. First try GitHub Releases API (most accurate for release notes and APK link)
    const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (releaseRes.ok) {
      const data = await releaseRes.json();
      const rawTag = data.tag_name || data.name || '';
      const latestVer = rawTag.replace(/^v/i, '').split('-')[0].trim();

      if (compareVersions(latestVer, CURRENT_APP_VERSION) > 0) {
        // Find APK download asset if present
        let apkAssetUrl = `https://github.com/${repo}/releases/download/${rawTag}/supari-calculator-offline.apk`;
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
          downloadUrl: data.html_url || `https://github.com/${repo}/releases/latest`,
          apkUrl: apkAssetUrl,
        };
      }
      return defaultResult;
    }
  } catch {
    // Fall through to version.json fallback
  }

  try {
    // 2. Fallback: Check raw version.json on GitHub (immune to API rate limits)
    const rawRes = await fetch(`https://raw.githubusercontent.com/${repo}/main/public/version.json?_t=${Date.now()}`);
    if (rawRes.ok) {
      const meta = await rawRes.json();
      const latestVer = (meta.version || '').replace(/^v/i, '').trim();

      if (latestVer && compareVersions(latestVer, CURRENT_APP_VERSION) > 0) {
        return {
          hasUpdate: true,
          latestVersion: latestVer,
          currentVersion: CURRENT_APP_VERSION,
          releaseTitle: meta.title || `ভার্সন ${latestVer}`,
          releaseNotes: meta.releaseNotes || 'নতুন আপডেট পাওয়া গেছে।',
          downloadUrl: meta.downloadUrl || `https://github.com/${repo}/releases/latest`,
          apkUrl: meta.apkUrl || `https://github.com/${repo}/releases/latest/download/supari-calculator-offline.apk`,
        };
      }
    }
  } catch {
    // Both failed (network or repo not found)
  }

  return defaultResult;
}
