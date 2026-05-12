import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  signOut,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth as firebaseAuth, db, googleProvider } from "./firebase";
import type { UserRole, UserData } from "@/types";

export const auth = firebaseAuth;

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email: cred.user.email,
    role,
    createdAt: Date.now(),
    approved: role === "faculty" ? false : undefined,
  });
  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function sendVerificationEmail() {
  if (firebaseAuth.currentUser) {
    await sendEmailVerification(firebaseAuth.currentUser);
  }
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserData) : null;
}

export async function createUserData(uid: string, email: string, role: UserRole) {
  const data: UserData = {
    uid,
    email,
    role,
    createdAt: Date.now(),
    approved: role === "faculty" ? false : undefined,
  };
  await setDoc(doc(db, "users", uid), data);
  return data;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged(callback);
}

export async function logout() {
  await signOut(auth);
}

const errorMessages: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Invalid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/popup-closed-by-user": "Sign-in cancelled.",
};

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  return code && errorMessages[code]
    ? errorMessages[code]
    : "Something went wrong. Please try again.";
}
