import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

const API_KEY_HEADER = 'x-api-key';

/**
 * Protects admin-only OTA endpoints with a single static API key, read
 * from the OTA_ADMIN_API_KEY env var. No JWT/session auth is used anywhere
 * in this project by design.
 */
@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.header(API_KEY_HEADER);
    const expectedKey = this.configService.get<string>('OTA_ADMIN_API_KEY');

    if (!expectedKey) {
      throw new UnauthorizedException(
        'Server misconfiguration: OTA_ADMIN_API_KEY is not set',
      );
    }

    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException('Invalid or missing x-api-key header');
    }

    return true;
  }
}
