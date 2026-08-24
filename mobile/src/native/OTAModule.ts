import { NativeModules } from 'react-native';

export interface OTAMetadata {
  currentVersion: string | null;
  sha256: string | null;
  previousVersion: string | null;
  pendingConfirmation: boolean;
  pendingTimestamp: number;
}

interface IOTAModule {
  getMetadata(): Promise<OTAMetadata>;
  sha256File(filePath: string): Promise<string>;
  downloadBundle(url: string): Promise<string>;
  verifyAndStage(
    downloadedPath: string,
    expectedSha256: string,
    newVersion: string,
  ): Promise<boolean>;
  confirmUpdate(): Promise<boolean>;
  restartApp(): Promise<boolean>;
  rollback(): Promise<boolean>;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
export const OTAModule: IOTAModule = NativeModules.OTAModule as IOTAModule;
