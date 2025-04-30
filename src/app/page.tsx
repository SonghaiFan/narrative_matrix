"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/features/auth/login-form";
import { useAuth } from "@/contexts/auth-context";
import { hasCompletedTasks, getTaskProgress } from "@/lib/task-progress";
import { ConsentForm } from "@/components/features/auth/consent-from";
import { UsabilityTest } from "@/components/features/auth/usability-test";
import { useProlificStore } from "@/store/prolific-store";
import { useProgressStore } from "@/stores/progress-store";

function HomeContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasConsented, setHasConsented] = useState(false);
  const [hasExplicitlyLoggedIn, setHasExplicitlyLoggedIn] = useState(false);
  const [hasPassedMouseTest, setHasPassedMouseTest] = useState(false);

  // Get Prolific parameters from URL and store them
  const prolificId = searchParams.get("PROLIFIC_PID");
  const studyId = searchParams.get("STUDY_ID");
  const sessionId = searchParams.get("SESSION_ID");
  const { setProlificParams, hasProlificParams, scenarioId } =
    useProlificStore();
  const { isStageCompleted } = useProgressStore();

  // Store Prolific parameters when they change
  useEffect(() => {
    setProlificParams({ prolificId, studyId, sessionId });
  }, [prolificId, studyId, sessionId, setProlificParams]);

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
            const completionUrl = `/completion?total=${progress.totalTasks}&correct=${progress.correctTasks}&type=text-visualisation`;
            router.push(completionUrl);
            return;
          }
        }

        // Only proceed if we have Prolific parameters
        if (!hasProlificParams || !studyId || !sessionId) {
          return;
        }

        // Check stage completion using the new progress store
        const hasCompletedIntro = isStageCompleted(studyId, sessionId, {
          type: "intro",
        });
        const hasCompletedTraining = isStageCompleted(studyId, sessionId, {
          type: "training",
          round: 1,
        });

        let initialRedirectPath = "";
        if (!hasCompletedIntro) {
          initialRedirectPath = `/${studyId}/${sessionId}/introduction`;
        } else if (!hasCompletedTraining) {
          initialRedirectPath = `/${studyId}/${sessionId}/training`;
        } else {
          initialRedirectPath = `/${studyId}/${sessionId}`;
        }

        router.push(initialRedirectPath);
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    router,
    hasExplicitlyLoggedIn,
    hasConsented,
    prolificId,
    studyId,
    sessionId,
    hasProlificParams,
    scenarioId,
    isStageCompleted,
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg overflow-hidden">
        {!hasPassedMouseTest ? (
          <div className="p-8">
            <UsabilityTest onComplete={() => setHasPassedMouseTest(true)} />
          </div>
        ) : (
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
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
