import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const serviceAccount = process.env.GOOGLE_SERVICES_JSON;
    
    if (!serviceAccount) {
      console.warn('Missing GOOGLE_SERVICES_JSON environment variable - Firebase Admin SDK not initialized');
      return null;
    }

    let serviceAccountKey;
    try {
      serviceAccountKey = JSON.parse(serviceAccount);
    } catch (error) {
      console.warn('Invalid GOOGLE_SERVICES_JSON format - Firebase Admin SDK not initialized');
      return null;
    }

    return initializeApp({
      credential: cert(serviceAccountKey),
      projectId: serviceAccountKey.project_id,
    });
  }
  
  return getApps()[0];
};

export const admin = initializeFirebaseAdmin();
export const messaging = admin ? getMessaging(admin) : null;
