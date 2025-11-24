import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase config - Real production credentials
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase (singleton pattern)
let firebaseApp;
let database;

try {
    if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
        console.log('🔥 Firebase initialized successfully');
    } else {
        firebaseApp = getApp();
        console.log('🔥 Firebase app already initialized');
    }

    database = getDatabase(firebaseApp);
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

export { firebaseApp, database };
