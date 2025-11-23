import { useActionState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../services/auth.service";
import { registerUserSchema } from "@auth/utils";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation();

  // Helper to translate error messages
  const translateError = (message) => {
    // If message contains ':', it's a translation key
    if (message && message.includes(":")) {
      return t(message);
    }
    return message;
  };

  // Form action handler following React 19 patterns
  async function registerAction(prevState, formData) {
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    // Client-side validation using shared schema
    const validation = registerUserSchema.safeParse({ name, email, password });

    if (!validation.success) {
      const fieldErrors = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0];
        if (field) {
          fieldErrors[field] = translateError(err.message);
        }
      });
      return {
        success: false,
        errors: fieldErrors,
        defaultValues: { name, email },
      };
    }

    try {
      await authService.register({ name, email, password });

      // Use startTransition for navigation
      startTransition(() => {
        navigate("/login");
      });

      return { success: true, errors: {} };
    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          if (err.field) {
            fieldErrors[err.field] = translateError(err.message);
          }
        });
        return {
          success: false,
          errors: fieldErrors,
          defaultValues: { name, email },
        };
      }

      return {
        success: false,
        errors: {
          general: translateError(error.message) || "Registration failed",
        },
        defaultValues: { name, email },
      };
    }
  }

  const [state, formAction, pending] = useActionState(registerAction, {
    success: false,
    errors: {},
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const isLoading = pending || isPending;

  return (
    <div className="w-full flex-1 flex items-center justify-center p-4 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700 relative">
      {/* Abstract Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-50/40 blur-3xl" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-slate-100/60 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 px-6">
        <div className="bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] border border-white/50 ring-1 ring-slate-900/5">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto size-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/10 mb-6 group transition-transform duration-500 hover:scale-105 hover:rotate-3">
              <svg
                className="size-6 text-white transition-transform duration-500 group-hover:-rotate-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your details to get started
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-6">
            {/* General Error Alert */}
            {state.errors.general && (
              <div
                className="rounded-2xl bg-red-50/50 p-4 border border-red-100 text-red-600 text-sm flex items-center gap-3"
                role="alert"
              >
                <svg
                  className="size-5 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{state.errors.general}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  defaultValue={state.defaultValues?.name}
                  disabled={isLoading}
                  className="block w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white sm:text-sm sm:leading-6 transition-all duration-200"
                  placeholder="John Doe"
                  aria-invalid={state.errors.name ? "true" : "false"}
                />
                {state.errors.name && (
                  <p className="text-sm text-red-500 font-medium ml-1">
                    {state.errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue={state.defaultValues?.email}
                  disabled={isLoading}
                  className="block w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white sm:text-sm sm:leading-6 transition-all duration-200"
                  placeholder="you@example.com"
                  aria-invalid={state.errors.email ? "true" : "false"}
                />
                {state.errors.email && (
                  <p className="text-sm text-red-500 font-medium ml-1">
                    {state.errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  className="block w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white sm:text-sm sm:leading-6 transition-all duration-200"
                  placeholder="••••••••"
                  aria-invalid={state.errors.password ? "true" : "false"}
                />
                {state.errors.password && (
                  <p className="text-sm text-red-500 font-medium ml-1">
                    {state.errors.password}
                  </p>
                )}
                <p className="text-xs text-slate-500 ml-1">
                  Must be at least 8 characters with uppercase, lowercase,
                  number, and special character
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin size-5 text-white/50"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <svg
                    className="size-4 text-white/50 group-hover:translate-x-0.5 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
