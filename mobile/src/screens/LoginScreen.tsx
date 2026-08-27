import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GoogleSignInCancelledError,
  signInWithGoogle,
} from '../services/firebaseAuth';

function LoginScreen() {
  const [signingIn, setSigningIn] = useState(false);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // onAuthStateChanged in App.tsx will pick up the new session
      // and swap this screen out automatically.
    } catch (err) {
      if (err instanceof GoogleSignInCancelledError) {
        // silently ignore user-cancelled sign-in
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Something went wrong signing in.';
      Alert.alert('Sign-in failed', message);
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-3xl">"</Text>
      <Text className="mt-2 text-2xl font-bold text-slate-800">
        Daily Quote
      </Text>
      <Text className="mt-2 text-center text-base text-slate-500">
        Sign in to sync your favorites and get update notifications.
      </Text>

      <TouchableOpacity
        className="mt-10 w-full flex-row items-center justify-center rounded-lg bg-slate-800 py-3.5"
        onPress={() => void handleSignIn()}
        disabled={signingIn}
      >
        {signingIn ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-base font-semibold text-white">
            Sign in with Google
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default LoginScreen;
