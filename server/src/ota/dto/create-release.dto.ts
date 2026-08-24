import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * JSON metadata fields sent alongside the bundle file upload on
 * `POST /ota/android/releases` (multipart/form-data, so every field
 * arrives as a string and booleans need explicit coercion).
 */
export class CreateReleaseDto {
  @IsString()
  @Matches(SEMVER_PATTERN, {
    message: 'otaVersion must be a semver string, e.g. 1.2.0',
  })
  otaVersion!: string;

  @IsString()
  @Matches(SEMVER_PATTERN, {
    message: 'nativeVersion must be a semver string, e.g. 1.0.0',
  })
  nativeVersion!: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mandatory: boolean = false;

  @IsOptional()
  @IsString()
  changelog?: string;
}
