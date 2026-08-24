/**
 * Pure semver-style version utilities for OTA update decisions.
 * Versions are dot-separated numeric segments, e.g. "1.2.3" or "1.0".
 */

/** Compare two version strings. Returns negative, 0, or positive. */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export interface UpdateCheckResult {
  acceptable: boolean;
  reason: string;
}

/**
 * Decides whether a candidate OTA update should be applied.
 *
 * Rules:
 *  1. requiredNativeVersion must EXACTLY match installedNativeVersion
 *  2. newOtaVersion must be STRICTLY GREATER than currentOtaVersion
 */
export function isUpdateAcceptable(
  currentOtaVersion: string,
  newOtaVersion: string,
  requiredNativeVersion: string,
  installedNativeVersion: string,
): UpdateCheckResult {
  if (requiredNativeVersion !== installedNativeVersion) {
    return {
      acceptable: false,
      reason: `Native version mismatch: bundle requires ${requiredNativeVersion}, installed ${installedNativeVersion}`,
    };
  }
  if (compareVersions(newOtaVersion, currentOtaVersion) <= 0) {
    return {
      acceptable: false,
      reason: `Not a newer OTA version: ${newOtaVersion} <= ${currentOtaVersion}`,
    };
  }
  return { acceptable: true, reason: 'ok' };
}
