"use client";

import {
  useEffect,
  useState,
  ReactNode,
  createContext,
  useContext,
} from "react";
import { app } from "@/lib/firebase/config";

// Create a context to indicate Firebase initialization status
interface FirebaseContextType {
  isInitialized: boolean;
  hasError: boolean;
  errorMessage?: string;
}

const FirebaseContext = createContext<FirebaseContextType>({
  isInitialized: false,
  hasError: false,
  errorMessage: undefined,
});

export const useFirebase = () => useContext(FirebaseContext);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    // Check if Firebase is initialized
    try {
      if (app) {
        console.log("Firebase initialized successfully");
        setIsInitialized(true);
      } else {
        throw new Error("Firebase app is undefined");
      }
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      setHasError(true);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unknown error initializing Firebase"
      );

      // Check if env variables are properly set
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        console.error(
          "Firebase API key not found. Make sure .env.local file is set up correctly."
        );
        setErrorMessage(
          "Environment variables not configured. Check .env.local file."
        );
      }
    }
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        isInitialized,
        hasError,
        errorMessage,
      }}
    >
      {hasError ? (
        <div className="p-4 bg-red-50 text-red-700 rounded mb-4">
          <h3 className="font-bold">Firebase Error</h3>
          <p>{errorMessage || "Error initializing Firebase"}</p>
          <p className="text-sm mt-2">
            Make sure your .env.local file contains the necessary Firebase
            configuration.
          </p>
        </div>
      ) : null}
      {children}
    </FirebaseContext.Provider>
  );
}

// You can wrap this component around your app in layout.tsx like:
// <FirebaseProvider>
//   {children}
// </FirebaseProvider>
