export const CURRENT_APP_VERSION = '2.4.0';

// Official locked repository and direct APK download URL (Cannot be edited by users)
export const OFFICIAL_GITHUB_REPO = 'rahatsharif504/supari-calculator';
export const OFFICIAL_APK_DOWNLOAD_URL = `https://github.com/${OFFICIAL_GITHUB_REPO}/releases/latest/download/supari-calculator-offline.apk`;
export const OFFICIAL_RELEASE_URL = `https://github.com/${OFFICIAL_GITHUB_REPO}/releases/latest`;

export interface AppUpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseTitle?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  apkUrl?: string;
}
