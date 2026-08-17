import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, getDocFromServer, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { UserProfile, UserBooking } from '../types';

// Clean configuration object (resolved duplicate declaration conflict)
const firebaseConfig = {
  apiKey: "AIzaSyD5x0-8Fpz4r6yq2eovTf1Aa79FaMwzQE4",
  authDomain: "pulse-matrix-hackathon.firebaseapp.com",
  projectId: "pulse-matrix-hackathon",
  storageBucket: "pulse-matrix-hackathon.firebasestorage.app",
  messagingSenderId: "852593226932",
  appId: "1:852593226932:web:e47d77e42f045ebe2653e1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firebase client is offline or project configuration needs verification.');
      return false;
    }
    return true;
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  try {
    const authPromise = signInWithEmailAndPassword(auth, email, pass);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 8000)
    );
    const result = await Promise.race([authPromise, timeoutPromise]);
    const user = result.user;

    return {
      uid: user.uid,
      id: user.uid,
      email: user.email || email,
      displayName: user.displayName || email.split('@')[0],
    };
  } catch (err) {
    console.error("Sign in execution error:", err);
    throw err;
  }
}

export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  const authPromise = createUserWithEmailAndPassword(auth, email, pass);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 8000)
  );
  const result = await Promise.race([authPromise, timeoutPromise]);
  return result.user;
}

export async function logOutFirebase(): Promise<void> {
  await signOut(auth);
}

export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
  } catch (error) {
    console.warn('Firestore user profile save warning:', error);
  }
}

export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn('Firestore get profile warning:', error);
    return null;
  }
}

export async function getAllUsersFromFirestore(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users: UserProfile[] = [];
    snap.forEach((docSnap) => {
      if (docSnap.exists()) {
        users.push(docSnap.data() as UserProfile);
      }
    });
    return users;
  } catch (error) {
    console.warn('Firestore fetch all users warning:', error);
    return [];
  }
}

// Booking Firestore Helpers
export async function saveBookingToFirestore(booking: UserBooking): Promise<void> {
  try {
    await setDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
  } catch (error) {
    console.warn('Firestore booking save fallback to local:', error);
  }
}

export async function getUserBookingsFromFirestore(userId: string): Promise<UserBooking[]> {
  try {
    const q = query(collection(db, 'bookings'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: UserBooking[] = [];
    snap.forEach((docSnap) => list.push(docSnap.data() as UserBooking));
    return list;
  } catch (error) {
    console.warn('Firestore fetch bookings error:', error);
    return [];
  }
}

export async function getAllBookingsFromFirestore(): Promise<UserBooking[]> {
  try {
    const snap = await getDocs(collection(db, 'bookings'));
    const list: UserBooking[] = [];
    snap.forEach((docSnap) => {
      if (docSnap.exists()) {
        list.push(docSnap.data() as UserBooking);
      }
    });
    return list;
  } catch (error) {
    console.warn('Firestore fetch all bookings warning:', error);
    return [];
  }
}

export async function updateBookingInFirestore(booking: UserBooking): Promise<void> {
  try {
    await setDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
  } catch (error) {
    console.warn('Firestore update booking error:', error);
  }
}

export async function cancelBookingInFirestore(bookingId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), { status: 'Cancelled' });
  } catch (error) {
    console.warn('Firestore cancel booking error:', error);
  }
}

export default app;