/**
 * Daily Quote
 *
 * @format
 */

import './global.css';

import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StatusBar,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getAuth, onAuthStateChanged, type User } from '@react-native-firebase/auth';
import { getMessaging, onMessage, subscribeToTopic } from '@react-native-firebase/messaging';
import RootNavigator from './src/navigation/RootNavigator';
import MandatoryUpdateModal from './src/components/MandatoryUpdateModal';
import LoginScreen from './src/screens/LoginScreen';
import { OTAModule } from './src/native/OTAModule';
import { useOtaStore } from './src/store/useOtaStore';
import { useFavoritesStore } from './src/store/useFavoritesStore';

const OTA_UPDATES_TOPIC = 'ota-updates';

async function setUpNotifications() {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
    await subscribeToTopic(getMessaging(), OTA_UPDATES_TOPIC);
  } catch (err) {
    console.warn('[Notifications] setup failed', err);
  }
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    // Confirm the current OTA update is healthy (cancels watchdog if pending).
    OTAModule.confirmUpdate().catch((err: unknown) => {
      console.warn('[OTA] confirmUpdate failed', err);
    });

    const unsubscribeAuth = onAuthStateChanged(getAuth(), nextUser => {
      setUser(nextUser);
      setAuthResolved(true);

      if (nextUser) {
        const localFavorites = useFavoritesStore.getState().favorites;
        void useFavoritesStore.getState().hydrate(localFavorites);
        void setUpNotifications();
        void useOtaStore.getState().checkForUpdate();
      } else {
        useFavoritesStore.getState().reset();
      }
    });

    const unsubscribeMessage = onMessage(getMessaging(), () => {
      void useOtaStore.getState().checkForUpdate();
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMessage();
    };
  }, []);

  if (!authResolved) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {user ? <RootNavigator /> : <LoginScreen />}
        <MandatoryUpdateModal />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
