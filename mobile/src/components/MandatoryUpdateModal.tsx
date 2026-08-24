import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useOtaStore } from '../store/useOtaStore';

/**
 * Non-dismissible blocking modal for mandatory OTA updates.
 * Shown when status === 'mandatory-update' or 'downloading' (after mandatory) or 'staging'.
 */
function MandatoryUpdateModal() {
  const {
    status,
    updateInfo,
    downloadProgress,
    applyAndRestart,
    startDownload,
  } = useOtaStore();

  const visible =
    status === 'mandatory-update' ||
    (status === 'downloading' && updateInfo?.mandatory === true) ||
    (status === 'staging' && updateInfo?.mandatory === true) ||
    (status === 'pending-restart' && updateInfo?.mandatory === true);

  if (!visible) return null;

  const progressPct = Math.round(downloadProgress * 100);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      // Not dismissible — no onRequestClose action
      onRequestClose={() => undefined}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-8">
        <View className="w-full rounded-2xl bg-white p-6 shadow-xl">
          <Text className="text-lg font-bold text-slate-800">
            Update Required
          </Text>
          <Text className="mt-2 text-sm text-slate-500">
            A mandatory update is available (v{updateInfo?.version}).
          </Text>
          {updateInfo?.changelog ? (
            <Text className="mt-3 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
              {updateInfo.changelog}
            </Text>
          ) : null}

          {status === 'mandatory-update' && (
            <TouchableOpacity
              className="mt-5 items-center rounded-xl bg-indigo-600 py-3"
              onPress={() => void startDownload()}
            >
              <Text className="font-semibold text-white">
                Download &amp; Install
              </Text>
            </TouchableOpacity>
          )}

          {(status === 'downloading' || status === 'staging') && (
            <View className="mt-5 items-center gap-2">
              <ActivityIndicator color="#4f46e5" />
              <Text className="text-sm text-slate-500">
                {status === 'staging'
                  ? 'Verifying…'
                  : `Downloading… ${progressPct}%`}
              </Text>
            </View>
          )}

          {status === 'pending-restart' && (
            <TouchableOpacity
              className="mt-5 items-center rounded-xl bg-green-600 py-3"
              onPress={() => void applyAndRestart()}
            >
              <Text className="font-semibold text-white">Restart Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default MandatoryUpdateModal;
