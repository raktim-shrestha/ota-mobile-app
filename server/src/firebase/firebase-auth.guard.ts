import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseAdminService } from './firebase-admin.service';

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Protects user-facing endpoints (e.g. Favorites) by verifying a Firebase
 * ID token sent as `Authorization: Bearer <idToken>`. On success, attaches
 * the decoded user info to `request.user`. Mirrors the shape of
 * AdminApiKeyGuard but for end-user auth instead of the static admin key.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or malformed Authorization header',
      );
    }

    const idToken = authHeader.slice('Bearer '.length).trim();

    try {
      const decoded = await this.firebaseAdmin.auth.verifyIdToken(idToken);
      request.user = {
        uid: decoded.uid,
        email: decoded.email ?? null,
        displayName: (decoded.name as string | undefined) ?? null,
        photoURL: (decoded.picture as string | undefined) ?? null,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }
  }
}
