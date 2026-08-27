import { AuthenticatedUser } from '../firebase/firebase-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { FavoritesService } from './favorites.service';

const USER: AuthenticatedUser = {
  uid: 'uid-123',
  email: 'user@example.com',
  displayName: 'Jane Doe',
  photoURL: 'https://example.com/photo.jpg',
};

describe('FavoritesService', () => {
  let prisma: {
    user: { upsert: jest.Mock };
    favorite: {
      findMany: jest.Mock;
      upsert: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let service: FavoritesService;

  beforeEach(() => {
    prisma = {
      user: { upsert: jest.fn().mockResolvedValue(undefined) },
      favorite: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new FavoritesService(prisma as unknown as PrismaService);
  });

  describe('listFavorites', () => {
    it('auto-upserts the user before listing favorites', async () => {
      await service.listFavorites(USER);

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { id: USER.uid },
        create: {
          id: USER.uid,
          email: USER.email,
          displayName: USER.displayName,
          photoURL: USER.photoURL,
        },
        update: {
          email: USER.email,
          displayName: USER.displayName,
          photoURL: USER.photoURL,
        },
      });
      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: USER.uid },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('addFavorite', () => {
    it('upserts the favorite scoped to the user and quoteId', async () => {
      await service.addFavorite(USER, 'quote-1');

      expect(prisma.user.upsert).toHaveBeenCalled();
      expect(prisma.favorite.upsert).toHaveBeenCalledWith({
        where: { userId_quoteId: { userId: USER.uid, quoteId: 'quote-1' } },
        create: { userId: USER.uid, quoteId: 'quote-1' },
        update: {},
      });
    });
  });

  describe('removeFavorite', () => {
    it('deletes only the favorite matching user and quoteId', async () => {
      await service.removeFavorite(USER, 'quote-1');

      expect(prisma.user.upsert).toHaveBeenCalled();
      expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
        where: { userId: USER.uid, quoteId: 'quote-1' },
      });
    });
  });
});
