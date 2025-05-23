# Firebase Integration for Narrative Matrix Study Data

This directory contains the Firebase integration for storing participant data in Firestore.

## Schema Structure

The database is organized into four main collections:

### 1. `users`

- Document ID: `prolificId` (or Firebase Auth UID)
- Fields:
  - `prolificId`: string
  - `createdAt`: timestamp
  - `lastActiveAt`: timestamp
  - `sessions`: array of session IDs

### 2. `sessions`

- Document ID: `sessionId` (unique per session, e.g., `${prolificId}_${timestamp}`)
- Fields:
  - `userId`: reference to `users/{prolificId}`
  - `studyId`: string
  - `scenarioType`: string
  - `role`: string ('normal' | 'domain')
  - `isTraining`: boolean
  - `deviceInfo`: object
  - `startedAt`: timestamp
  - `endedAt`: timestamp
  - `stageTimings`: object with timing data for different stages
  - `tasks`: array of task IDs
  - `feedbackId`: reference to `feedback/{feedbackId}`

### 3. `tasks`

- Document ID: `taskId` (unique per task instance, e.g., `${sessionId}_${taskIndex}`)
- Fields:
  - `sessionId`: reference to `sessions/{sessionId}`
  - `userId`: reference to `users/{prolificId}`
  - `question`: string
  - `userAnswer`: string | array
  - `markedEvents`: array of numbers
  - `isSkipped`: boolean
  - `isTimeUp`: boolean
  - `isTraining`: boolean
  - `startTime`: timestamp
  - `endTime`: timestamp
  - `createdAt`: timestamp

### 4. `feedback`

- Document ID: `feedbackId` (unique, e.g., `${sessionId}`)
- Fields:
  - `sessionId`: reference to `sessions/{sessionId}`
  - `userId`: reference to `users/{prolificId}`
  - `visualizationUsage`: object
    - `frequency`: number
    - `helpfulness`: number
    - `preference`: number
  - `experience`: object
    - `withVisualization`: number
    - `withoutVisualization`: number
    - `overall`: number
  - `visualizationRatings`: object
    - `entity`: number
    - `topic`: number
    - `time`: number
  - `comments`: string
  - `createdAt`: timestamp

## Setup Requirements

To use this Firebase integration, you need to:

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore in your project
3. Create a `.env.local` file in the root of your project with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Flag to toggle between API endpoints and Firestore
NEXT_PUBLIC_USE_FIRESTORE=true
```

## Usage

The integration is designed to work alongside the existing API endpoints. Set `NEXT_PUBLIC_USE_FIRESTORE=true` to use Firestore directly, or `false` to use the API endpoints.

The Firebase functions are imported and used conditionally in `src/lib/api-submission.ts`, providing a seamless way to switch between direct Firestore operations and API endpoints without changing any application code.

## Security Rules

Consider implementing security rules in Firebase to protect your data. Here's a basic example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users only
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // More specific rules can be added for each collection
  }
}
```
