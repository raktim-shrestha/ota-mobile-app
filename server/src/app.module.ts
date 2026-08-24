import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtaModule } from './ota/ota.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    OtaModule,
  ],
})
export class AppModule {}
