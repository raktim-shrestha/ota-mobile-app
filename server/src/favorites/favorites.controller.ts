import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Favorite } from '@prisma/client';
import type { AuthenticatedRequest } from '../firebase/firebase-auth.guard';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import { FavoritesService } from './favorites.service';

/**
 * Per-item Favorites CRUD for the signed-in user (identified via the
 * verified Firebase ID token, not a route param). No bulk/full-replace
 * endpoint — the mobile client migrates local favorites one at a time
 * through POST on first login.
 */
@Controller('favorites')
@UseGuards(FirebaseAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest): Promise<Favorite[]> {
    return this.favoritesService.listFavorites(req.user);
  }

  @Post(':quoteId')
  async add(
    @Req() req: AuthenticatedRequest,
    @Param('quoteId') quoteId: string,
  ): Promise<Favorite> {
    return this.favoritesService.addFavorite(req.user, quoteId);
  }

  @Delete(':quoteId')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('quoteId') quoteId: string,
  ): Promise<{ success: true }> {
    await this.favoritesService.removeFavorite(req.user, quoteId);
    return { success: true };
  }
}
