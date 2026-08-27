import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Release } from '@prisma/client';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { basename } from 'node:path';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckUpdateResponseDto } from './dto/check-update-response.dto';
import { CreateReleaseDto } from './dto/create-release.dto';
import { isGreaterSemver } from './semver.util';
import { sha256OfBuffer, writeReleaseFile } from './ota-storage.util';

/** Single FCM topic all Android clients subscribe to for OTA push alerts. */
const OTA_UPDATES_TOPIC = 'ota-updates';

@Injectable()
export class OtaService {
  private readonly logger = new Logger(OtaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}

  /**
   * Finds the best available published release for a client on a given
   * native app version, if any. Never suggests a downgrade: only releases
   * with otaVersion strictly greater than the client's current otaVersion
   * are considered, and among those the highest otaVersion wins.
   */
  async checkForUpdate(
    nativeVersion: string,
    currentOtaVersion: string,
  ): Promise<CheckUpdateResponseDto> {
    const candidates = await this.prisma.release.findMany({
      where: { nativeVersion, published: true },
    });

    const newerCandidates = candidates.filter((release) =>
      isGreaterSemver(release.otaVersion, currentOtaVersion),
    );

    if (newerCandidates.length === 0) {
      return { updateAvailable: false };
    }

    const best = newerCandidates.reduce((highest, release) =>
      isGreaterSemver(release.otaVersion, highest.otaVersion)
        ? release
        : highest,
    );

    return {
      updateAvailable: true,
      version: best.otaVersion,
      mandatory: best.mandatory,
      downloadUrl: `/ota/android/download/${best.otaVersion}`,
      sha256: best.sha256,
      size: best.fileSizeBytes,
      changelog: best.changelog ?? null,
    };
  }

  async getPublishedReleaseOrThrow(otaVersion: string): Promise<Release> {
    const release = await this.prisma.release.findFirst({
      where: { otaVersion, published: true },
    });

    if (!release) {
      throw new NotFoundException(
        `No published release found for OTA version ${otaVersion}`,
      );
    }

    return release;
  }

  async getBundleStream(otaVersion: string) {
    const release = await this.getPublishedReleaseOrThrow(otaVersion);

    try {
      await fs.access(release.filePath);
    } catch {
      throw new NotFoundException(
        `Bundle file for OTA version ${otaVersion} is missing on disk`,
      );
    }

    return {
      stream: createReadStream(release.filePath),
      fileName: basename(release.filePath),
      fileSizeBytes: release.fileSizeBytes,
    };
  }

  async listReleases(): Promise<Release[]> {
    return this.prisma.release.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /**
   * Publishes a new release: hashes + stores the uploaded bundle on disk,
   * then writes the DB record. Rejects exact duplicate
   * (nativeVersion, otaVersion) combos.
   */
  async createRelease(
    dto: CreateReleaseDto,
    file: Express.Multer.File,
  ): Promise<Release> {
    const existing = await this.prisma.release.findUnique({
      where: {
        nativeVersion_otaVersion: {
          nativeVersion: dto.nativeVersion,
          otaVersion: dto.otaVersion,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A release for nativeVersion=${dto.nativeVersion} otaVersion=${dto.otaVersion} already exists`,
      );
    }

    const sha256 = sha256OfBuffer(file.buffer);
    const fileName = file.originalname || 'bundle.zip';
    const filePath = await writeReleaseFile(
      dto.otaVersion,
      fileName,
      file.buffer,
    );

    this.logger.log(
      `Publishing release ota=${dto.otaVersion} native=${dto.nativeVersion} sha256=${sha256} size=${file.buffer.length}`,
    );

    const release = await this.prisma.release.create({
      data: {
        otaVersion: dto.otaVersion,
        nativeVersion: dto.nativeVersion,
        mandatory: dto.mandatory,
        changelog: dto.changelog,
        sha256,
        fileSizeBytes: file.buffer.length,
        filePath,
        published: true,
      },
    });

    if (release.mandatory) {
      // Fire-and-forget: never let a push failure block the release response.
      // Polling (checkForUpdate) remains the source of truth regardless.
      this.sendMandatoryUpdatePush(release).catch((err: unknown) => {
        this.logger.error(
          `Failed to send FCM push for release ota=${release.otaVersion}: ${String(err)}`,
        );
      });
    }

    return release;
  }

  private async sendMandatoryUpdatePush(release: Release): Promise<void> {
    const body =
      release.changelog && release.changelog.trim().length > 0
        ? release.changelog
        : 'A required update is ready to install.';

    await this.firebaseAdmin.messaging.send({
      topic: OTA_UPDATES_TOPIC,
      notification: {
        title: `Update ${release.otaVersion} available`,
        body,
      },
      android: {
        notification: {
          channelId: OTA_UPDATES_TOPIC,
        },
      },
    });

    this.logger.log(
      `Sent FCM mandatory-update push for release ota=${release.otaVersion}`,
    );
  }
}
