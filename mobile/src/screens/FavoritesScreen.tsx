import { FlatList, Text, View } from 'react-native';
import { useFavoritesStore } from '../store/useFavoritesStore';

function FavoritesScreen() {
  const favorites = useFavoritesStore(state => state.favorites);

  if (favorites.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-slate-800">
          No favorites yet
        </Text>
        <Text className="mt-2 text-center text-base text-slate-500">
          Quotes you favorite will show up here.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <View className="mb-4 rounded-lg border border-slate-200 p-4">
            <Text className="text-base italic text-slate-800">
              "{item.text}"
            </Text>
            <Text className="mt-2 text-sm text-slate-500">— {item.author}</Text>
          </View>
        )}
      />
    </View>
  );
}

export default FavoritesScreen;
