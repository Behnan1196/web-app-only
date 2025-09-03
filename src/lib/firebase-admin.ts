import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const serviceAccount = process.env.GOOGLE_SERVICES_JSON;
    
    if (!serviceAccount) {
      throw new Error('Missing GOOGLE_SERVICES_JSON environment variable');
    }

    let serviceAccountKey;
    try {
      serviceAccountKey = JSON.parse(serviceAccount);
    } catch (error) {
      throw new Error('Invalid GOOGLE_SERVICES_JSON format. Must be valid JSON.');
    }

    return initializeApp({
      credential: cert(serviceAccountKey),
      projectId: serviceAccountKey.project_id,
    });
  }
  
  return getApps()[0];
};

export const admin = initializeFirebaseAdmin();
export const messaging = getMessaging(admin);
