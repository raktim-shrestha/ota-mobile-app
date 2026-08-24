import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useOtaStore } from '../store/useOtaStore';

/**
 * Dismissible card shown on AboutScreen when a non-mandatory OTA update is ready.
 */
function UpdateAvailableCard() {
  const {
    status,
    updateInfo,
    downloadProgress,
    startDownload,
    applyAndRestart,
    dismiss,
  } = useOtaStore();

  if (
    status !== 'update-available' &&
    status !== 'downloading' &&
    status !== 'staging' &&
    status !== 'pending-restart'
  ) {
    return null;
  }

  // Don't render for mandatory updates — MandatoryUpdateModal handles those.
  if (updateInfo?.mandatory) return null;

  const progressPct = Math.round(downloadProgress * 100);

  return (
    <View className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <View className="flex-row items-start justify-between">
        <Text className="text-sm font-semibold text-indigo-800">
          Update available — v{updateInfo?.version}
        </Text>
        {status === 'update-available' && (
          <TouchableOpacity onPress={dismiss} hitSlop={8}>
            <Text className="text-lg text-slate-400">✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {updateInfo?.changelog ? (
        <Text className="mt-2 text-xs text-indigo-600">
          {updateInfo.changelog}
        </Text>
      ) : null}

      {status === 'update-available' && (
        <TouchableOpacity
          className="mt-3 items-center rounded-lg bg-indigo-600 py-2"
          onPress={() => void startDownload()}
        >
          <Text className="text-sm font-semibold text-white">Download</Text>
        </TouchableOpacity>
      )}

      {(status === 'downloading' || status === 'staging') && (
        <View className="mt-3 flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text className="text-xs text-indigo-600">
            {status === 'staging' ? 'Verifying…' : `${progressPct}%`}
          </Text>
        </View>
      )}

      {status === 'pending-restart' && (
        <TouchableOpacity
          className="mt-3 items-center rounded-lg bg-green-600 py-2"
          onPress={() => void applyAndRestart()}
        >
          <Text className="text-sm font-semibold text-white">
            Restart to Apply
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default UpdateAvailableCard;
