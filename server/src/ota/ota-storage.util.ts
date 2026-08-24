import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

/**
 * Root directory (relative to the server package root) where all OTA
 * bundle files live. Gitignored — see root .gitignore.
 */
export const OTA_RELEASES_ROOT = join(process.cwd(), 'ota-releases', 'android');

export function releaseDir(otaVersion: string): string {
  return join(OTA_RELEASES_ROOT, otaVersion);
}

export function releaseFilePath(otaVersion: string, fileName: string): string {
  return join(releaseDir(otaVersion), fileName);
}

/**
 * Computes the SHA-256 hash of a buffer. Used to verify bundle integrity
 * server-side — client-supplied hashes are never trusted.
 */
export function sha256OfBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function writeReleaseFile(
  otaVersion: string,
  fileName: string,
  buffer: Buffer,
): Promise<string> {
  const dir = releaseDir(otaVersion);
  await fs.mkdir(dir, { recursive: true });
  const filePath = releaseFilePath(otaVersion, fileName);
  await fs.writeFile(filePath, buffer);
  return filePath;
}
