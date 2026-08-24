import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface FavoriteQuote {
  id: string;
  text: string;
  author: string;
}

interface FavoritesState {
  favorites: FavoriteQuote[];
  addFavorite: (quote: FavoriteQuote) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: quote =>
        set(state => ({
          favorites: state.favorites.some(f => f.id === quote.id)
            ? state.favorites
            : [...state.favorites, quote],
        })),
      removeFavorite: id =>
        set(state => ({
          favorites: state.favorites.filter(f => f.id !== id),
        })),
      isFavorite: id => get().favorites.some(f => f.id === id),
    }),
    {
      name: 'daily-quote-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
