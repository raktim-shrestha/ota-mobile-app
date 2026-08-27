import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FavoritesModule } from './favorites/favorites.module';
import { FirebaseModule } from './firebase/firebase.module';
import { OtaModule } from './ota/ota.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    FirebaseModule,
    OtaModule,
    FavoritesModule,
  ],
})
export class AppModule {}
