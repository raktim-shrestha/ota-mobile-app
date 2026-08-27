import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

/**
 * Thin wrapper around the Firebase Admin SDK, initialized once from a
 * service account JSON blob stored in the FIREBASE_SERVICE_ACCOUNT_JSON
 * env var (never a committed file — mirrors the OTA_ADMIN_API_KEY
 * env-var-based secret pattern used elsewhere in this project).
 */
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app!: App;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (getApps().length > 0) {
      this.app = getApps()[0];
      return;
    }

    const raw = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

    if (!raw) {
      throw new Error(
        'Server misconfiguration: FIREBASE_SERVICE_ACCOUNT_JSON is not set',
      );
    }

    let serviceAccount: Record<string, unknown>;
    try {
      serviceAccount = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the full ' +
          'contents of the downloaded service account key file as a single-line env var.',
      );
    }

    this.app = initializeApp({
      credential: cert(serviceAccount as never),
    });

    this.logger.log('Firebase Admin SDK initialized');
  }

  get auth(): Auth {
    return getAuth(this.app);
  }

  get messaging(): Messaging {
    return getMessaging(this.app);
  }
}
