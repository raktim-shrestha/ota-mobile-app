import { Global, Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

/**
 * Global module so FirebaseAdminService/FirebaseAuthGuard can be injected
 * anywhere without each feature module re-importing it (mirrors PrismaModule).
 */
@Global()
@Module({
  providers: [FirebaseAdminService, FirebaseAuthGuard],
  exports: [FirebaseAdminService, FirebaseAuthGuard],
})
export class FirebaseModule {}
