import { Injectable } from '@nestjs/common';
import { Favorite } from '@prisma/client';
import { AuthenticatedUser } from '../firebase/firebase-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures a User row exists for this Firebase-authenticated caller and
   * that its profile fields are in sync with the latest ID token claims.
   * Called at the top of every Favorites request — there is no dedicated
   * /auth/register endpoint or separate UsersModule.
   */
  private async upsertUser(user: AuthenticatedUser): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.uid },
      create: {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      update: {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
    });
  }

  async listFavorites(user: AuthenticatedUser): Promise<Favorite[]> {
    await this.upsertUser(user);
    return this.prisma.favorite.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavorite(
    user: AuthenticatedUser,
    quoteId: string,
  ): Promise<Favorite> {
    await this.upsertUser(user);
    return this.prisma.favorite.upsert({
      where: { userId_quoteId: { userId: user.uid, quoteId } },
      create: { userId: user.uid, quoteId },
      update: {},
    });
  }

  async removeFavorite(user: AuthenticatedUser, quoteId: string) {
    await this.upsertUser(user);
    await this.prisma.favorite.deleteMany({
      where: { userId: user.uid, quoteId },
    });
  }
}
