"use client";

import { SignOutButton } from "@clerk/nextjs";

interface OnboardingClientProps {
  userName: string;
  userEmail: string;
}

export default function OnboardingClient({ userName, userEmail }: OnboardingClientProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">
            🌶️ SAMBEL PECEL LUDY
          </h1>
          <p className="text-gray-600">Setup Profile</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-red-800 font-semibold mb-2">⚠️ Setup Required</h2>
          <p className="text-red-700 text-sm mb-4">
            We couldn&apos;t automatically create your profile. This might be due to:
          </p>
          <ul className="text-red-700 text-sm list-disc list-inside space-y-1 mb-4">
            <li>Database connection issues</li>
            <li>Missing permissions</li>
            <li>Configuration problems</li>
          </ul>
          <p className="text-red-700 text-sm">
            Please contact your administrator for assistance.
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Your Account:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Name:</span> {userName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {userEmail}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Retry
            </button>
            <SignOutButton redirectUrl="/sign-in">
              <button className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            If this problem persists, please reach out to your supervisor or IT
            administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
