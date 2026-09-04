import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AcademicLevel, LearningPace, TeachingStrategy } from '../types/database';
import {
  auth,
  db,
  googleProvider,
  isFirebaseEnabled,
  isGoogleAuthEnabled,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateFirebaseProfile,
  firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser,
} from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  academicLevel?: AcademicLevel;
  learningPace?: LearningPace;
  preferredStrategy?: TeachingStrategy;
  targetGoal?: string;
  focusSubject?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCloudSynced: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'corestack_learn_auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Sync Firebase User with Firestore Profile and Server Session
  const syncFirebaseProfile = async (fbUser: FirebaseUser, overrides?: Partial<User>) => {
    if (!db) {
      setUser(overrides as User || user || null);
      return;
    }

    try {
      const userRef = doc(db, 'users', fbUser.uid);
      let firestoreData: any = null;

      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          firestoreData = snap.data();
          setIsCloudSynced(true);
        }
      } catch (err) {
        console.warn('Could not read user profile from Firestore, creating initial:', err);
      }

      const now = new Date().toISOString();
      const initialProfile = {
        id: fbUser.uid,
        name: overrides?.name || firestoreData?.name || fbUser.displayName || 'Student Scholar',
        email: fbUser.email || overrides?.email || 'scholar@university.edu',
        academicLevel: overrides?.academicLevel || firestoreData?.academicLevel || 'UNDERGRADUATE',
        learningPace: overrides?.learningPace || firestoreData?.learningPace || 'BALANCED',
        preferredStrategy: overrides?.preferredStrategy || firestoreData?.preferredStrategy || 'REAL_WORLD_ANALOGY',
        targetGoal: overrides?.targetGoal || firestoreData?.targetGoal || 'Master core concepts and academic principles',
        focusSubject: overrides?.focusSubject || firestoreData?.focusSubject || 'Computer Science',
        streakDays: firestoreData?.streakDays || 1,
        totalStudyMinutes: firestoreData?.totalStudyMinutes || 0,
        masteredConceptsCount: firestoreData?.masteredConceptsCount || 0,
        inProgressConceptsCount: firestoreData?.inProgressConceptsCount || 0,
        createdAt: firestoreData?.createdAt || now,
        updatedAt: now,
      };

      try {
        await setDoc(userRef, initialProfile, { merge: true });
        setIsCloudSynced(true);
      } catch (err) {
        console.warn('Firestore setDoc initial profile notice:', err);
      }

      // Sync with server session
      const res = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fbUser.uid,
          id: fbUser.uid,
          ...initialProfile,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        // Fallback user representation
        setUser(initialProfile as User);
      }
    } catch (err) {
      console.error('Error syncing Firebase user profile:', err);
    }
  };

  // Listen for Firebase Auth State Changes
  useEffect(() => {
    const initializeSession = async () => {
      const persistedToken = localStorage.getItem(TOKEN_KEY);

      if (persistedToken) {
        setToken(persistedToken);
        setIsLoading(true);
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${persistedToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setToken(persistedToken);
          } else {
            localStorage.removeItem(TOKEN_KEY);
            setUser(null);
            setToken(null);
          }
        } catch (err) {
          console.warn('Could not restore session:', err);
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setToken(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setToken(null);
        setFirebaseUser(null);
        setIsCloudSynced(false);
        setIsLoading(false);
      }
    };

    initializeSession();

    if (!auth || !isFirebaseEnabled) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncFirebaseProfile(fbUser);
        setIsLoading(false);
      } else if (!localStorage.getItem(TOKEN_KEY)) {
        setUser(null);
        setToken(null);
        setIsCloudSynced(false);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch current user if token exists
  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(authToken);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (err) {
      console.error('Error fetching authenticated user:', err);
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!isGoogleAuthEnabled || !auth || !googleProvider) {
      throw new Error('Google sign-in is disabled on this local environment. Please use email login instead.');
    }

    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncFirebaseProfile(result.user);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      throw new Error(err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    let firebaseSuccess = false;

    // 1. Attempt Firebase Email/Password Sign-In if enabled
    if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          firebaseSuccess = true;
          await syncFirebaseProfile(userCredential.user);
        }
      } catch (fbErr: any) {
        console.info('Firebase direct email sign-in status:', fbErr.code || fbErr.message);
        if (fbErr.code === 'auth/operation-not-allowed') {
          setIsLoading(false);
          throw new Error('Email/password sign-in is disabled in Firebase. Enable Email/Password under Firebase Console → Authentication → Sign-in method.');
        }
        if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/invalid-login-credentials' || fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password') {
          setIsLoading(false);
          throw new Error('Incorrect email or password. For testing, use the Use Demo Login button or create this account in Firebase Authentication.');
        }
      }
    }

    // 2. Full-stack authenticated backend fallback
    if (!firebaseSuccess) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('The hosted authentication API is not deployed. Deploy the app as a Node web service with npm start, or enable Firebase Email/Password authentication.');
          }
          throw new Error(data.error || 'Failed to sign in.');
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);

        // Sync with Firestore doc for persistent cloud visibility
        try {
          const userRef = doc(db, 'users', data.user.id);
          await setDoc(
            userRef,
            {
              ...data.user,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          setIsCloudSynced(true);
        } catch (fsErr) {
          console.warn('Firestore sync on login notice:', fsErr);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    if (!auth) {
      throw new Error('Firebase is not configured for this deployment.');
    }

    const demoEmail = 'alex.student@corestack.edu';
    const demoPassword = 'learn123';
    let demoUser: FirebaseUser;

    try {
      demoUser = (await signInWithEmailAndPassword(auth, demoEmail, demoPassword)).user;
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Enable Email/Password under Firebase Console → Authentication → Sign-in method before using Demo Login.');
      }
      if (!['auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(error.code)) {
        throw new Error(error.message || 'Demo login failed.');
      }

      try {
        demoUser = (await createUserWithEmailAndPassword(auth, demoEmail, demoPassword)).user;
      } catch (createError: any) {
        if (createError.code === 'auth/email-already-in-use') {
          throw new Error('The demo account already exists with a different password. Reset it or create a Firebase user with email alex.student@corestack.edu and password learn123.');
        }
        throw new Error(createError.message || 'Demo account could not be created.');
      }
      await updateFirebaseProfile(demoUser, { displayName: 'Abdulsalam' });
    }

    await syncFirebaseProfile(demoUser, {
      name: 'Abdulsalam',
      email: demoEmail,
      focusSubject: 'General Studies',
    });
  };

  const register = async (params: RegisterParams) => {
    setIsLoading(true);
    let fbUser: FirebaseUser | null = null;
    let registeredSuccessfully = false;

    // 1. Attempt creating user in Firebase Auth
    if (auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, params.email, params.password);
        fbUser = userCredential.user;
      if (fbUser) {
        try {
          await updateFirebaseProfile(fbUser, { displayName: params.name });
        } catch (pErr) {
          console.warn('Could not update Firebase displayName:', pErr);
        }

        // Direct write to Firestore users collection
        const userRef = doc(db, 'users', fbUser.uid);
        const now = new Date().toISOString();
        const profileDoc = {
          id: fbUser.uid,
          name: params.name,
          email: params.email,
          academicLevel: params.academicLevel || 'UNDERGRADUATE',
          learningPace: params.learningPace || 'BALANCED',
          preferredStrategy: params.preferredStrategy || 'REAL_WORLD_ANALOGY',
          targetGoal: params.targetGoal || 'Deep conceptual mastery in my subjects',
          focusSubject: params.focusSubject || 'General Studies',
          streakDays: 1,
          totalStudyMinutes: 0,
          masteredConceptsCount: 0,
          inProgressConceptsCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        try {
          await setDoc(userRef, profileDoc, { merge: true });
          setIsCloudSynced(true);
        } catch (fsErr) {
          console.warn('Firestore setDoc during registration:', fsErr);
        }

        // Sync with server session
        await syncFirebaseProfile(fbUser, params);
        registeredSuccessfully = true;
      }
      } catch (fbErr: any) {
        console.info('Firebase Auth registration notice (fallback active):', fbErr.code || fbErr.message);
        if (fbErr.code === 'auth/operation-not-allowed') {
          setIsLoading(false);
          throw new Error('Email/password account creation is disabled in Firebase. Enable Email/Password under Firebase Console → Authentication → Sign-in method.');
        }
      }
    }

    // 2. Seamless registration fallback into user store & Firestore
    if (!registeredSuccessfully) {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('The hosted authentication API is not deployed. Deploy the app as a Node web service with npm start, or enable Firebase Email/Password authentication.');
          }
          throw new Error(data.error || 'Failed to create account.');
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);

        // Mirror into Firestore users collection so it appears in the Cloud Firestore database
        try {
          const userRef = doc(db, 'users', data.user.id);
          const now = new Date().toISOString();
          await setDoc(
            userRef,
            {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              academicLevel: data.user.academicLevel || params.academicLevel || 'UNDERGRADUATE',
              learningPace: data.user.learningPace || params.learningPace || 'BALANCED',
              preferredStrategy: data.user.preferredStrategy || params.preferredStrategy || 'REAL_WORLD_ANALOGY',
              targetGoal: data.user.targetGoal || params.targetGoal || 'Master core academic principles',
              focusSubject: data.user.focusSubject || params.focusSubject || 'Computer Science',
              streakDays: data.user.streakDays || 1,
              totalStudyMinutes: data.user.totalStudyMinutes || 0,
              masteredConceptsCount: data.user.masteredConceptsCount || 0,
              inProgressConceptsCount: data.user.inProgressConceptsCount || 0,
              createdAt: data.user.createdAt || now,
              updatedAt: now,
            },
            { merge: true }
          );
          setIsCloudSynced(true);
        } catch (fsErr) {
          console.warn('Firestore doc mirror notice:', fsErr);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('Firebase signout:', err);
      }
    }

    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setFirebaseUser(null);
    setIsCloudSynced(false);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!token && !firebaseUser) throw new Error('Not authenticated');

    // If Firebase user exists, also update Firestore
    if (firebaseUser) {
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        setIsCloudSynced(true);
      } catch (err) {
        console.warn('Firestore profile update warning:', err);
      }
    }

    if (token) {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setUser(data.user);
    } else if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await syncFirebaseProfile(firebaseUser);
    } else if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        isAuthenticated: !!user,
        isLoading,
        isCloudSynced,
        login,
        demoLogin,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

