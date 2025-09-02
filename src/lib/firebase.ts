import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBZrJtVRkcQSeRazVWILkaEAPvEFAHaeHc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sablon-4d924.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sablon-4d924",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sablon-4d924.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "770265453337",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:770265453337:web:45a22c1b3fc1aaffd8ab88"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// VAPID key for web push notifications
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BMb_Nv78DlpfohPzqs8AxSZJ67dGTG1JN7TO_dWD1ch4XaUcUpd6LOEePGrF7EEGEbaVtkblp7ABGYU3tnswkc8";

export default app;
