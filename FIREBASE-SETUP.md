# Firebase Setup Guide for Narrative Matrix

This guide will help you set up Firebase for the Narrative Matrix application to store participant data.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "narrative-matrix")
4. Follow the setup wizard (you can disable Google Analytics if you don't need it)
5. Wait for the project to be created

## 2. Set Up Firestore Database

1. In your Firebase project dashboard, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (recommended for data security)
4. Select a location for your database (choose the one closest to your users)
5. Click "Enable"

## 3. Register Your Web App

1. In your Firebase project dashboard, click the web icon (</>) to add a web app
2. Enter a name for your app (e.g., "narrative-matrix-web")
3. Optionally, set up Firebase Hosting if you plan to deploy the app using Firebase
4. Click "Register app"
5. You'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};
```

6. Copy these values for the next step

## 4. Configure Environment Variables

1. Create a `.env.local` file in the root of your project with the following:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID

# Flag to toggle between API endpoints and Firestore
# Set to 'true' to use Firestore directly, 'false' to use API endpoints
NEXT_PUBLIC_USE_FIRESTORE=true
```

2. Replace the placeholder values with your Firebase configuration values

## 5. Set Up Firestore Security Rules

1. In your Firebase project dashboard, go to "Firestore Database" → "Rules" tab
2. Replace the default rules with the following (modify as needed for your security requirements):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write to all collections if the request is authenticated
    match /{document=**} {
      allow read, write: if true; // For development only
      // For production, use:
      // allow read, write: if request.auth != null;
    }

    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }

    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if true;
      allow write: if true;
    }

    // Tasks collection
    match /tasks/{taskId} {
      allow read: if true;
      allow write: if true;
    }

    // Feedback collection
    match /feedback/{feedbackId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

3. Click "Publish" to deploy the rules

## 6. Add the FirebaseProvider to Your App (Optional)

To ensure Firebase is properly initialized, you can add the FirebaseProvider to your app's layout:

1. Open `src/app/layout.tsx` (or your main layout file)
2. Import the FirebaseProvider:

```javascript
import { FirebaseProvider } from "@/components/firebase-provider";
```

3. Wrap your app with the FirebaseProvider:

```jsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en">
      <body>
        <FirebaseProvider>{children}</FirebaseProvider>
      </body>
    </html>
  );
}
```

## 7. Using Firebase in Your Application

The application is now set up to use Firebase Firestore. When `NEXT_PUBLIC_USE_FIRESTORE=true`, all data operations will be performed directly against Firestore instead of using API endpoints.

Key files to look at:

- `src/lib/firebase/config.ts` - Firebase initialization
- `src/lib/firebase/firestore.ts` - Firestore utility functions
- `src/lib/api-submission.ts` - API client that conditionally uses Firestore

## 8. Data Structure in Firestore

The data in Firestore will be organized as follows:

- **users**: Collection of study participants
- **sessions**: Collection of study sessions
- **tasks**: Collection of task/quiz responses
- **feedback**: Collection of participant feedback

See the README in `src/lib/firebase/README.md` for more details on the schema structure.

## 9. Monitoring and Analytics

Once participants start using the app:

1. You can view the stored data in the Firestore Database section of the Firebase console
2. You can monitor app usage in the "Usage and billing" section
3. If you enabled Analytics, you can view analytics data in the "Analytics" section

## Troubleshooting

- If you see authentication errors, make sure your Firebase API Key is correct in `.env.local`
- If data isn't being saved, check the browser console for errors and verify your Firestore rules
- If you're getting CORS errors, make sure your Firebase project settings allow requests from your app's domain
