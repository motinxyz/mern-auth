import React from "react";
import * as Sentry from "@sentry/react";
import { useTranslation } from "react-i18next";

/**
 * Error Fallback Component
 * Displayed when the ErrorBoundary catches an error
 */
function ErrorFallback({ error, resetErrorBoundary }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="mx-auto size-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="size-8 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t("system:errors.somethingWentWrong") || "Something went wrong"}
        </h2>

        <p className="text-slate-500 mb-6">
          {t("system:errors.unexpectedError") ||
            "We encountered an unexpected error. Our team has been notified."}
        </p>

        {import.meta.env.DEV && error && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg text-left overflow-auto max-h-40">
            <code className="text-xs text-slate-700 font-mono">
              {error.message}
            </code>
          </div>
        )}

        <button
          onClick={resetErrorBoundary}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
        >
          {t("system:actions.tryAgain") || "Try again"}
        </button>
      </div>
    </div>
  );
}

/**
 * Global Error Boundary
 * Wraps the application to catch unhandled errors and report them to Sentry
 */
export const ErrorBoundary = ({ children }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetErrorBoundary={resetError} />
      )}
      beforeCapture={(scope) => {
        scope.setTag("location", "ErrorBoundary");
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};
