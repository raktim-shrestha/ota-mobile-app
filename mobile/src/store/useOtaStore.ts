import { create } from 'zustand';
import { APP_NATIVE_VERSION } from '../constants/appInfo';
import { OTAModule, type OTAMetadata } from '../native/OTAModule';
import {
  checkForUpdate,
  downloadBundle,
  type OTACheckResponse,
} from '../services/otaClient';
import { isUpdateAcceptable } from '../services/OTAVersionManager';

export type OtaStatus =
  | 'idle'
  | 'checking'
  | 'update-available'
  | 'mandatory-update'
  | 'downloading'
  | 'staging'
  | 'pending-restart'
  | 'error'
  | 'up-to-date';

export interface OtaState {
  status: OtaStatus;
  metadata: OTAMetadata | null;
  updateInfo: OTACheckResponse | null;
  downloadProgress: number; // 0–1
  error: string | null;
  dismissed: boolean;

  // Actions
  loadMetadata: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
  startDownload: () => Promise<void>;
  applyAndRestart: () => Promise<void>;
  dismiss: () => void;
  clearError: () => void;
}

export const useOtaStore = create<OtaState>()((set, get) => ({
  status: 'idle',
  metadata: null,
  updateInfo: null,
  downloadProgress: 0,
  error: null,
  dismissed: false,

  loadMetadata: async () => {
    try {
      const metadata = await OTAModule.getMetadata();
      set({ metadata });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  checkForUpdate: async () => {
    set({ status: 'checking', error: null });
    try {
      const metadata = await OTAModule.getMetadata();
      set({ metadata });

      const currentOtaVersion = metadata.currentVersion ?? '0.0.0';
      const response = await checkForUpdate(
        APP_NATIVE_VERSION,
        currentOtaVersion,
      );

      if (!response.updateAvailable || !response.version) {
        set({ status: 'up-to-date', updateInfo: null });
        return;
      }

      // nativeVersion on the server Release record IS the requiredNativeVersion.
      // The server already filters by nativeVersion at check time, so if a result
      // comes back it is compatible. We pass APP_NATIVE_VERSION as both args so
      // the version-comparison logic only checks semver ordering, not native match.
      const check = isUpdateAcceptable(
        currentOtaVersion,
        response.version,
        APP_NATIVE_VERSION, // requiredNativeVersion (server already filtered)
        APP_NATIVE_VERSION,
      );

      if (!check.acceptable) {
        set({ status: 'up-to-date', updateInfo: null });
        return;
      }

      set({
        status: response.mandatory ? 'mandatory-update' : 'update-available',
        updateInfo: response,
        dismissed: false,
      });
    } catch (e) {
      set({ status: 'error', error: String(e) });
    }
  },

  startDownload: async () => {
    const { updateInfo } = get();
    if (!updateInfo?.downloadUrl || !updateInfo.sha256 || !updateInfo.version)
      return;

    set({ status: 'downloading', downloadProgress: 0, error: null });
    try {
      const downloadedPath = await downloadBundle(
        updateInfo.downloadUrl,
        ({ received, total }) => {
          set({ downloadProgress: total > 0 ? received / total : 0 });
        },
      );

      set({ status: 'staging' });
      await OTAModule.verifyAndStage(
        downloadedPath,
        updateInfo.sha256,
        updateInfo.version,
      );

      const metadata = await OTAModule.getMetadata();
      set({ status: 'pending-restart', metadata });
    } catch (e) {
      set({ status: 'error', error: String(e), downloadProgress: 0 });
    }
  },

  applyAndRestart: async () => {
    try {
      await OTAModule.restartApp();
    } catch (e) {
      set({ status: 'error', error: String(e) });
    }
  },

  dismiss: () => set({ dismissed: true }),
  clearError: () => set({ status: 'idle', error: null }),
}));
