import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfigFile from '../../firebase-applet-config.json';

const mergedFirebaseConfig = {
  ...firebaseConfigFile,
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || firebaseConfigFile.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || firebaseConfigFile.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || firebaseConfigFile.projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) || firebaseConfigFile.storageBucket,
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) || firebaseConfigFile.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) || firebaseConfigFile.appId,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) || firebaseConfigFile.measurementId,
};

const hasFirebaseCoreConfig = Boolean(
  mergedFirebaseConfig.apiKey &&
    mergedFirebaseConfig.authDomain &&
    mergedFirebaseConfig.projectId &&
    mergedFirebaseConfig.appId
);

const app = hasFirebaseCoreConfig ? (!getApps().length ? initializeApp(mergedFirebaseConfig) : getApp()) : null;

const databaseId = typeof (mergedFirebaseConfig as any).firestoreDatabaseId === 'string'
  ? (mergedFirebaseConfig as any).firestoreDatabaseId
  : '';

const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isLocalDevHost = ['localhost', '127.0.0.1', '[::1]'].includes(currentHostname) || currentHostname.endsWith('.localhost');

// Initialize Firebase Auth
export const auth = app ? getAuth(app) : null;

export const isFirebaseEnabled = Boolean(app);
export const isGoogleAuthEnabled = Boolean(
  app &&
    auth &&
    (!isLocalDevHost || (mergedFirebaseConfig.authDomain || '').toLowerCase().includes('localhost'))
);
export const db: Firestore | null = app ? (databaseId ? getFirestore(app, databaseId) : getFirestore(app)) : null;

export const googleProvider = isGoogleAuthEnabled ? new GoogleAuthProvider() : null;
export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateFirebaseProfile,
  firebaseSignOut,
  onAuthStateChanged,
};
export type { FirebaseUser };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on startup
export async function testFirestoreConnection(): Promise<boolean> {
  if (!db) {
    return false;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/offline|permission|unauthorized|insufficient permissions/i.test(message)) {
      return false;
    }

    if (/the client is offline/i.test(message)) {
      return false;
    }

    return false;
  }
}

// Automatically test connection
testFirestoreConnection().catch((err) => console.log('Firestore connection check:', err));
