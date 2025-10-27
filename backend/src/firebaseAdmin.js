import admin from 'firebase-admin';

const hasFirebaseCreds = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

let verifyFirebaseIdToken;

if (hasFirebaseCreds) {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
  }

  verifyFirebaseIdToken = async (idToken) => {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded; // contains uid, email, name, picture
  };
} else {
  // Fallback for local/dev without Firebase credentials
  verifyFirebaseIdToken = async () => {
    throw new Error('Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
  };
}

export { verifyFirebaseIdToken };


