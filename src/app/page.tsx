"use client";

import { LoginForm } from "@/components/features/auth/login-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Narrative Matrix
          </h1>
          <p className="text-gray-500">Interactive Demo Platform</p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
