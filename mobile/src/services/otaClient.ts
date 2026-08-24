import Config from 'react-native-config';
import { OTAModule } from '../native/OTAModule';

const BASE_URL = Config.OTA_SERVER_URL ?? 'http://10.0.2.2:3000';

export interface OTACheckResponse {
  updateAvailable: boolean;
  version?: string;
  sha256?: string;
  downloadUrl?: string;
  mandatory?: boolean;
  changelog?: string | null;
  size?: number;
}

/** Check server for available OTA update. */
export async function checkForUpdate(
  nativeVersion: string,
  otaVersion: string,
): Promise<OTACheckResponse> {
  const url = `${BASE_URL}/ota/android/check?nativeVersion=${encodeURIComponent(
    nativeVersion,
  )}&otaVersion=${encodeURIComponent(otaVersion)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OTA check failed: HTTP ${res.status}`);
  }
  return res.json() as Promise<OTACheckResponse>;
}

export interface DownloadProgress {
  received: number;
  total: number;
}

/**
 * Downloads the OTA bundle via native OTAModule (HttpURLConnection).
 * Returns absolute path to the downloaded file.
 */
export async function downloadBundle(
  downloadUrl: string,
  _onProgress?: (p: DownloadProgress) => void,
): Promise<string> {
  const fullUrl = downloadUrl.startsWith('http')
    ? downloadUrl
    : `${BASE_URL}${downloadUrl}`;

  return OTAModule.downloadBundle(fullUrl);
}
