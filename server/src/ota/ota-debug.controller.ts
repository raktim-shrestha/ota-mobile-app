import { Controller, Post, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard';

/**
 * Debug-only chaos-testing endpoints used for later manual QA of the
 * client's download/rollback handling (interrupted downloads, corrupted
 * bundles, artificial latency/errors). Admin-protected like every other
 * mutating OTA endpoint.
 *
 * These are intentionally minimal stubs for now — full chaos logic
 * (actually corrupting stored bytes, injecting delay/error into the
 * download response) is implemented in a later phase once the client-side
 * rollback watchdog exists to verify against.
 */
@Controller('ota/android/debug')
@UseGuards(AdminApiKeyGuard)
export class OtaDebugController {
  @Post('toggle-corrupt-bundle')
  toggleCorruptBundle() {
    // TODO(phase 6 chaos testing): flip an in-memory/DB flag that makes the
    // download endpoint intentionally serve a byte-corrupted copy of the
    // requested bundle, so the client's SHA-256 verification + rollback
    // watchdog can be exercised end-to-end.
    return { ok: true, message: 'Not yet implemented (stub).' };
  }

  @Post('toggle-delay-error')
  toggleDelayError() {
    // TODO(phase 6 chaos testing): flip an in-memory/DB flag that makes
    // check/download endpoints inject artificial latency or a random
    // 500 error, to exercise the client's retry/error UX.
    return { ok: true, message: 'Not yet implemented (stub).' };
  }
}
