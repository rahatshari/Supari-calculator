import {
  CURRENT_APP_VERSION,
  OFFICIAL_GITHUB_REPO,
  OFFICIAL_APK_DOWNLOAD_URL,
  OFFICIAL_RELEASE_URL,
  AppUpdateInfo,
} from '../config/version';

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
 * Official locked repository. Cannot be modified or tampered with.
 */
export function getTargetRepo(): string {
  return OFFICIAL_GITHUB_REPO;
}

/**
 * Directly triggers the Android APK download and update installation.
 */
export function installAppUpdate(apkUrl?: string): void {
  const targetUrl = apkUrl || OFFICIAL_APK_DOWNLOAD_URL;
  if (typeof window !== 'undefined') {
    // Navigating directly to the APK download triggers the Android Package Installer
    window.location.href = targetUrl;
  }
}

/**
 * Automatically checks GitHub Releases and version.json for updates against the locked official repository.
 */
export async function checkForUpdates(): Promise<AppUpdateInfo> {
  const defaultResult: AppUpdateInfo = {
    hasUpdate: false,
    latestVersion: CURRENT_APP_VERSION,
    currentVersion: CURRENT_APP_VERSION,
    downloadUrl: OFFICIAL_RELEASE_URL,
    apkUrl: OFFICIAL_APK_DOWNLOAD_URL,
  };

  if (!navigator.onLine) {
    return defaultResult;
  }

  const repo = OFFICIAL_GITHUB_REPO;

  try {
    // 1. Check official GitHub Releases API
    const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (releaseRes.ok) {
      const data = await releaseRes.json();
      const rawTag = data.tag_name || data.name || '';
      const latestVer = rawTag.replace(/^v/i, '').split('-')[0].trim();

      if (compareVersions(latestVer, CURRENT_APP_VERSION) > 0) {
        let apkAssetUrl = OFFICIAL_APK_DOWNLOAD_URL;
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
          downloadUrl: data.html_url || OFFICIAL_RELEASE_URL,
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
          downloadUrl: meta.downloadUrl || OFFICIAL_RELEASE_URL,
          apkUrl: meta.apkUrl || OFFICIAL_APK_DOWNLOAD_URL,
        };
      }
    }
  } catch {
    // Network or server unreachable
  }

  return defaultResult;
}
