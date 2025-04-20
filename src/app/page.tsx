"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/features/auth/login-form";
import { useAuth } from "@/contexts/auth-context";
import { hasCompletedTasks, getTaskProgress } from "@/lib/task-progress";
import { ConsentForm } from "@/components/features/auth/consent-from";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasConsented, setHasConsented] = useState(false);
  const [hasExplicitlyLoggedIn, setHasExplicitlyLoggedIn] = useState(false);

  // Get Prolific parameters from URL
  const prolificId = searchParams.get("PROLIFIC_PID");
  const studyId = searchParams.get("STUDY_ID");
  const sessionId = searchParams.get("SESSION_ID");

  // Check if we have Prolific parameters
  const hasProlificParams = !!prolificId;

  // Check local storage for previously accepted consent
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConsent = localStorage.getItem("hasAcceptedConsent");
      if (savedConsent === "true") {
        setHasConsented(true);
      }
    }
  }, []);

  // Handle consent checkbox changes
  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setHasConsented(isChecked);

    if (typeof window !== "undefined") {
      localStorage.setItem("hasAcceptedConsent", isChecked ? "true" : "false");
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      setHasExplicitlyLoggedIn(true);
    }
  }, [isLoading, isAuthenticated, user]);

  // Handle successful login from LoginForm
  const handleSuccessfulLogin = () => {
    setHasExplicitlyLoggedIn(true);
  };

  // Redirect users based on role - only after explicit login
  useEffect(() => {
    if (!hasExplicitlyLoggedIn || !hasConsented) {
      return;
    }

    if (!isLoading && isAuthenticated && user) {
      // Redirect domain users to dashboard
      if (user.role === "domain") {
        router.push("/dashboard");
        return;
      }

      // Handle normal users
      if (user.role === "normal") {
        // Check for full completion first
        const hasCompleted = hasCompletedTasks(user.id);
        if (hasCompleted) {
          const progress = getTaskProgress(user.id);
          if (progress) {
            let completionUrl = `/completion?total=${progress.totalTasks}&correct=${progress.correctTasks}&type=text-visualisation`;

            // Add Prolific parameters if present
            if (hasProlificParams) {
              if (prolificId) completionUrl += `&PROLIFIC_PID=${prolificId}`;
              if (studyId) completionUrl += `&STUDY_ID=${studyId}`;
              if (sessionId) completionUrl += `&SESSION_ID=${sessionId}`;
            }

            router.push(completionUrl);
            return;
          }
        }

        // Get scenario ID from user
        const scenarioId = user.defaultScenario;
        const numericId = scenarioId.replace("text-visual-", "");
        const introKey = `hasCompletedIntro-${scenarioId}`;
        const trainingKey = `hasCompletedTraining-${scenarioId}`;
        let hasCompletedIntro = false;
        let hasCompletedTraining = false;

        if (typeof window !== "undefined") {
          hasCompletedIntro = localStorage.getItem(introKey) === "true";
          hasCompletedTraining = localStorage.getItem(trainingKey) === "true";
        }

        let initialRedirectPath = "";
        if (!hasCompletedIntro) {
          initialRedirectPath = `/text-visual/${numericId}/introduction`;
        } else if (!hasCompletedTraining) {
          initialRedirectPath = `/text-visual/${numericId}/training`;
        } else {
          initialRedirectPath = `/text-visual/${numericId}`;
        }

        // Add Prolific parameters to redirect if present
        if (hasProlificParams) {
          const separator = initialRedirectPath.includes("?") ? "&" : "?";
          if (prolificId) initialRedirectPath += `${separator}PROLIFIC_PID=${prolificId}`;
          if (studyId) initialRedirectPath += `&STUDY_ID=${studyId}`;
          if (sessionId) initialRedirectPath += `&SESSION_ID=${sessionId}`;
        }

        router.push(initialRedirectPath);
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router, hasExplicitlyLoggedIn, hasConsented, prolificId, studyId, sessionId, hasProlificParams]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left side - Consent Form */}
          <ConsentForm onConsent={setHasConsented} />
          {/* Right side - Login Form */}
          <div className="p-8 bg-gray-50 flex flex-col">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Narrative Matrix
              </h1>
              <p className="text-gray-500">User Study Platform</p>
            </div>

            <div className="flex-grow flex flex-col justify-center">
              <div className="max-w-sm mx-auto w-full">
                <LoginForm
                  isDisabled={!hasConsented}
                  urlUsername={prolificId}
                  urlSessionId={sessionId}
                  onLoginSuccess={handleSuccessfulLogin}
                  isProlificUser={hasProlificParams}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
