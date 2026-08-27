import { create } from 'zustand';
import { QUOTES, type Quote } from '../data/quotes';
import {
  addFavoriteRemote,
  fetchFavorites,
  removeFavoriteRemote,
} from '../services/favoritesClient';

export interface FavoriteQuote {
  id: string;
  text: string;
  author: string;
}

const QUOTES_BY_ID: Record<string, Quote> = QUOTES.reduce(
  (acc, q) => {
    acc[q.id] = q;
    return acc;
  },
  {} as Record<string, Quote>,
);

interface FavoritesState {
  favorites: FavoriteQuote[];
  hydrated: boolean;
  hydrating: boolean;
  addFavorite: (quote: FavoriteQuote) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  /** Loads favorites from the server on login. If `localFavorites` is
   * provided (e.g. favorites accumulated pre-login this session), they
   * are migrated to the server one at a time first. */
  hydrate: (localFavorites?: FavoriteQuote[]) => Promise<void>;
  /** Clears in-memory favorites on sign-out. */
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  favorites: [],
  hydrated: false,
  hydrating: false,

  addFavorite: quote => {
    set(state => ({
      favorites: state.favorites.some(f => f.id === quote.id)
        ? state.favorites
        : [...state.favorites, quote],
    }));
    addFavoriteRemote(quote.id).catch((err: unknown) => {
      console.warn('[Favorites] addFavoriteRemote failed', err);
    });
  },

  removeFavorite: id => {
    set(state => ({
      favorites: state.favorites.filter(f => f.id !== id),
    }));
    removeFavoriteRemote(id).catch((err: unknown) => {
      console.warn('[Favorites] removeFavoriteRemote failed', err);
    });
  },

  isFavorite: id => get().favorites.some(f => f.id === id),

  hydrate: async localFavorites => {
    set({ hydrating: true });
    try {
      if (localFavorites && localFavorites.length > 0) {
        for (const fav of localFavorites) {
          try {
            await addFavoriteRemote(fav.id);
          } catch (err) {
            console.warn('[Favorites] migration addFavoriteRemote failed', err);
          }
        }
      }

      const serverFavorites = await fetchFavorites();
      const favorites: FavoriteQuote[] = serverFavorites
        .map(f => QUOTES_BY_ID[f.quoteId])
        .filter((q): q is Quote => Boolean(q))
        .map(q => ({ id: q.id, text: q.text, author: q.author }));

      set({ favorites, hydrated: true, hydrating: false });
    } catch (err) {
      console.warn('[Favorites] hydrate failed', err);
      set({ hydrating: false });
    }
  },

  reset: () => {
    set({ favorites: [], hydrated: false, hydrating: false });
  },
}));
