import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { resolve } from "path";

function getServiceAccount() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (fromEnv) return JSON.parse(fromEnv);

  try {
    const path = resolve(process.cwd(), "service-account.json");
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function initAdmin() {
  if (getApps().length) return getApps()[0];

  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    return initializeApp({ credential: cert(serviceAccount) });
  }

  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const adminApp = initAdmin();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
