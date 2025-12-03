const admin = require('firebase-admin');

// Initialize Firebase Admin
// We expect FIREBASE_SERVICE_ACCOUNT environment variable to contain the JSON string of the service account
// OR we can use default credentials if running in Google Cloud (but we are in AWS Lambda)
let isFirebaseInitialized = false;

function initFirebase() {
    if (isFirebaseInitialized) return;

    try {
        // Use environment variables with VITE_ prefix for consistency with frontend
        if (process.env.VITE_FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // Handle newlines in env var
                }),
                databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
            });
            console.log('Firebase Admin initialized with environment variables');
        } else {
            console.error('Missing Firebase credentials in environment variables');
            // For local testing or if configured differently
            if (process.env.IS_OFFLINE) {
                console.log('Running offline, skipping strict Firebase init check');
            }
        }
        isFirebaseInitialized = true;
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
    }
}

module.exports.handler = async (event) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Options' }),
        };
    }

    try {
        initFirebase();

        const body = JSON.parse(event.body || '{}');
        const { userId, title, body: messageBody, data } = body;

        if (!userId || !title || !messageBody) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
            };
        }

        // 1. Get tokens from Realtime Database
        // Path: users/{userId}/fcmTokens
        const db = admin.database();
        const tokensRef = db.ref(`users/${userId}/fcmTokens`);
        const snapshot = await tokensRef.once('value');

        if (!snapshot.exists()) {
            console.log(`No tokens found for user ${userId}`);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: false, message: 'No devices registered for this user' }),
            };
        }

        const tokensMap = snapshot.val();
        // tokensMap is like { "token1": { ... }, "token2": { ... } }
        const tokens = Object.keys(tokensMap);

        if (tokens.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: false, message: 'No valid tokens found' }),
            };
        }

        // 2. Construct message
        const message = {
            notification: {
                title: title,
                body: messageBody,
            },
            data: data || {},
            tokens: tokens,
        };

        // 3. Send multicast message
        const response = await admin.messaging().sendMulticast(message);

        console.log(`${response.successCount} messages were sent successfully`);

        // 4. Cleanup invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });

            // Optional: Remove failed tokens from DB
            // const updates = {};
            // failedTokens.forEach(token => {
            //   updates[`users/${userId}/fcmTokens/${token}`] = null;
            // });
            // await db.ref().update(updates);
            console.log('Failed tokens:', failedTokens);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                sentCount: response.successCount,
                failureCount: response.failureCount
            }),
        };

    } catch (error) {
        console.error('Error sending notification:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
