import {
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  getIdToken as firebaseGetIdToken,
  type User,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export type AuthUser = User;

const WEB_CLIENT_ID =
  '1018140977027-hie28tka12hiljs6hlrq8mjq47h9m02u.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
});

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function.
 */
export function subscribeToAuthState(
  callback: (user: AuthUser | null) => void,
): () => void {
  return onAuthStateChanged(getAuth(), callback);
}

/** Returns the currently signed-in user, or null. */
export function getCurrentUser(): AuthUser | null {
  return getAuth().currentUser;
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google Sign-In was cancelled.');
    this.name = 'GoogleSignInCancelledError';
  }
}

/**
 * Runs the full Google Sign-In -> Firebase credential exchange flow.
 * Throws GoogleSignInCancelledError if the user cancels, or a regular
 * Error with a user-facing message for other failures.
 */
export async function signInWithGoogle(): Promise<AuthUser> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const signInResult = await GoogleSignin.signIn();

    if (!isSuccessResponse(signInResult)) {
      // cancelled or noSavedCredentialFound
      throw new GoogleSignInCancelledError();
    }

    const idToken = signInResult.data?.idToken;
    if (!idToken) {
      throw new Error('No ID token returned from Google Sign-In.');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(getAuth(), credential);
    return userCredential.user;
  } catch (error) {
    if (error instanceof GoogleSignInCancelledError) {
      throw error;
    }

    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          throw new GoogleSignInCancelledError();
        case statusCodes.IN_PROGRESS:
          throw new Error('Sign-in is already in progress.');
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error(
            'Google Play Services is not available on this device.',
          );
        default:
          throw new Error(`Google Sign-In failed: ${error.message}`);
      }
    }

    throw error instanceof Error
      ? error
      : new Error('An unknown error occurred during Google Sign-In.');
  }
}

/** Signs out of both Google and Firebase. */
export async function signOutOfGoogle(): Promise<void> {
  await firebaseSignOut(getAuth());
  try {
    await GoogleSignin.signOut();
  } catch (err: unknown) {
    console.warn('[Auth] GoogleSignin.signOut failed', err);
  }
}

/** Gets a fresh Firebase ID token for the current user, or null if signed out. */
export async function getFreshIdToken(): Promise<string | null> {
  const user = getAuth().currentUser;
  if (!user) {
    return null;
  }
  return firebaseGetIdToken(user);
}
