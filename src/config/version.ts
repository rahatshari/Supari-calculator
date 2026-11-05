export const CURRENT_APP_VERSION = '1.0.0';
export const DEFAULT_GITHUB_REPO = 'rahatsharif504/supari-calculator';

export interface AppUpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseTitle?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  apkUrl?: string;
}
