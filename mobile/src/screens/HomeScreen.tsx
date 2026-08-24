import { useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { getTodayQuote } from '../data/quotes';
import { useFavoritesStore } from '../store/useFavoritesStore';

const todayQuote = getTodayQuote();

function HomeScreen() {
  const addFavorite = useFavoritesStore(state => state.addFavorite);
  const removeFavorite = useFavoritesStore(state => state.removeFavorite);
  const isFavorite = useFavoritesStore(state => state.isFavorite);
  const [favored, setFavored] = useState(isFavorite(todayQuote.id));

  function toggleFavorite() {
    if (favored) {
      removeFavorite(todayQuote.id);
      setFavored(false);
    } else {
      addFavorite(todayQuote);
      setFavored(true);
    }
  }

  async function shareQuote() {
    await Share.share({
      message: `"${todayQuote.text}" — ${todayQuote.author}`,
    });
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View className="flex-1 bg-white px-6 pt-12">
      {/* Header */}
      <Text className="text-sm font-medium uppercase tracking-widest text-slate-400">
        {today}
      </Text>
      <Text className="mt-1 text-2xl font-bold text-slate-800">
        Daily Quote
      </Text>

      {/* Quote card */}
      <View className="mt-10 rounded-2xl bg-slate-50 p-6 shadow-sm">
        <Text className="text-3xl text-slate-300">"</Text>
        <Text className="mt-1 text-lg leading-relaxed text-slate-800">
          {todayQuote.text}
        </Text>
        <Text className="mt-4 text-right text-sm font-semibold text-slate-500">
          — {todayQuote.author}
        </Text>
      </View>

      {/* Actions */}
      <View className="mt-6 flex-row gap-4">
        <Pressable
          onPress={toggleFavorite}
          className="flex-1 items-center rounded-xl border border-slate-200 bg-white py-3"
        >
          <Text className="text-base font-medium text-slate-700">
            {favored ? '♥ Saved' : '♡ Save'}
          </Text>
        </Pressable>

        <Pressable
          onPress={shareQuote}
          className="flex-1 items-center rounded-xl bg-slate-800 py-3"
        >
          <Text className="text-base font-medium text-white">↑ Share</Text>
        </Pressable>
      </View>

      {/* Footer hint */}
      <Text className="mt-8 text-center text-xs text-slate-400">
        A new quote every day. Tap ♡ to save to Favorites.
      </Text>
    </View>
  );
}

export default HomeScreen;
