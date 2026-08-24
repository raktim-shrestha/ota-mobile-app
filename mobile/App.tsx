/**
 * Daily Quote
 *
 * @format
 */

import './global.css';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import MandatoryUpdateModal from './src/components/MandatoryUpdateModal';
import { OTAModule } from './src/native/OTAModule';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Confirm the current OTA update is healthy (cancels watchdog if pending).
    OTAModule.confirmUpdate().catch((err: unknown) => {
      console.warn('[OTA] confirmUpdate failed', err);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <RootNavigator />
        <MandatoryUpdateModal />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
