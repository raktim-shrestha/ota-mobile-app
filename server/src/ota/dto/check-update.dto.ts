import { IsString, Matches } from 'class-validator';

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * Query params sent by the client to `GET /ota/android/check`.
 */
export class CheckUpdateQueryDto {
  @IsString()
  @Matches(SEMVER_PATTERN, {
    message: 'nativeVersion must be a semver string, e.g. 1.0.0',
  })
  nativeVersion!: string;

  @IsString()
  @Matches(SEMVER_PATTERN, {
    message: 'otaVersion must be a semver string, e.g. 0.0.0',
  })
  otaVersion!: string;
}
