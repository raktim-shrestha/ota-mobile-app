/**
 * Minimal semver-style ("major.minor.patch") comparison helpers.
 * Intentionally simple: this project's OTA versions are always plain
 * `\d+.\d+.\d+` strings (validated at the DTO layer), no pre-release tags.
 */

/**
 * Returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
export function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) {
      return diff > 0 ? 1 : -1;
    }
  }
  return 0;
}

export function isGreaterSemver(a: string, b: string): boolean {
  return compareSemver(a, b) > 0;
}
