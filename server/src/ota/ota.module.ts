import { Module } from '@nestjs/common';
import { OtaAdminController } from './ota-admin.controller';
import { OtaDebugController } from './ota-debug.controller';
import { OtaController } from './ota.controller';
import { OtaService } from './ota.service';

@Module({
  controllers: [OtaController, OtaAdminController, OtaDebugController],
  providers: [OtaService],
})
export class OtaModule {}
