import { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import UpdateAvailableCard from '../components/UpdateAvailableCard';
import { APP_NATIVE_VERSION } from '../constants/appInfo';
import { useOtaStore } from '../store/useOtaStore';

function AboutScreen() {
  const {
    status,
    metadata,
    error,
    dismissed,
    loadMetadata,
    checkForUpdate,
    clearError,
  } = useOtaStore();

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  const currentVersion = metadata?.currentVersion ?? 'built-in';
  const isChecking = status === 'checking';

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-6 py-8"
    >
      <Text className="text-xl font-bold text-slate-800">About</Text>
      <Text className="mt-2 text-base text-slate-500">
        Daily Quote — custom self-built OTA update demo.
      </Text>

      {/* Version info */}
      <View className="mt-8 rounded-lg border border-slate-200 p-4">
        <Text className="text-sm font-semibold text-slate-700">OTA Status</Text>
        <View className="mt-2 gap-1">
          <Text className="text-xs text-slate-500">
            Native version:{' '}
            <Text className="font-medium text-slate-700">
              {APP_NATIVE_VERSION}
            </Text>
          </Text>
          <Text className="text-xs text-slate-500">
            OTA version:{' '}
            <Text className="font-medium text-slate-700">{currentVersion}</Text>
          </Text>
          {metadata?.pendingConfirmation && (
            <Text className="mt-1 text-xs font-medium text-amber-600">
              ⏳ Pending confirmation (watchdog active)
            </Text>
          )}
        </View>

        {error ? (
          <View className="mt-3 rounded-lg bg-red-50 p-3">
            <Text className="text-xs text-red-700">{error}</Text>
            <TouchableOpacity onPress={clearError} className="mt-2">
              <Text className="text-xs font-medium text-red-600">Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {status === 'up-to-date' && !dismissed && (
          <Text className="mt-3 text-xs font-medium text-green-600">
            ✓ Up to date
          </Text>
        )}

        {/* Check for update button */}
        {status === 'idle' || status === 'up-to-date' || status === 'error' ? (
          <TouchableOpacity
            className="mt-4 items-center rounded-lg bg-slate-800 py-2.5"
            onPress={() => void checkForUpdate()}
            disabled={isChecking}
          >
            <Text className="text-sm font-semibold text-white">
              Check for Update
            </Text>
          </TouchableOpacity>
        ) : null}

        {isChecking && (
          <View className="mt-4 flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#1e293b" />
            <Text className="text-xs text-slate-500">Checking…</Text>
          </View>
        )}
      </View>

      {/* Non-mandatory update card */}
      {!dismissed && <UpdateAvailableCard />}
    </ScrollView>
  );
}

export default AboutScreen;
