/**
 * Response shape for `GET /ota/android/check`.
 */
export class CheckUpdateResponseDto {
  updateAvailable!: boolean;
  version?: string;
  mandatory?: boolean;
  downloadUrl?: string;
  sha256?: string;
  size?: number;
  changelog?: string | null;
}
