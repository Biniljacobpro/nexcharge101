import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const firebaseGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    const profile = {
      firstName: result.user.displayName?.split(' ')[0] || 'Nex',
      lastName: result.user.displayName?.split(' ').slice(1).join(' ') || 'Charge',
      email: result.user.email,
      photoURL: result.user.photoURL,
    };
    return { idToken, profile };
  } catch (error) {
    // Handle Cross-Origin-Opener-Policy errors gracefully
    if (error.message?.includes('Cross-Origin-Opener-Policy') ||
        error.code === 'auth/popup-closed-by-user') {
      throw new Error('Authentication was cancelled or blocked by browser security policy. Please try again.');
    }
    throw error;
  }
};

