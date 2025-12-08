import { useActionState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../services/auth.service";
import { loginUserSchema } from "@auth/utils";
import {
  LockIcon,
  AlertCircleIcon,
  SpinnerIcon,
  ArrowRightIcon,
} from "../../../shared/components/icons";

interface FormState {
  success: boolean;
  errors: Record<string, string>;
}

interface ValidationError {
  path: (string | number | symbol)[];
  message: string;
}

interface ApiError {
  errors?: Array<{ field?: string; message: string }>;
  message?: string;
}

export default function LoginForm() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation(["auth", "validation"]);

  // Helper to translate error messages
  const translateError = (message: string): string => {
    // If message is a key (e.g., validation:email.required), translate it
    // Otherwise return as is, or try to find a translation
    return t(message);
  };

  // Form action handler following React 19 patterns
  async function loginAction(
    _prevState: FormState,
    formData: FormData
  ): Promise<FormState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Client-side validation using shared schema
    const validation = loginUserSchema.safeParse({ email, password });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err: ValidationError) => {
        const field = err.path[0] as string;
        if (field) {
          fieldErrors[field] = translateError(err.message);
        }
      });
      return { success: false, errors: fieldErrors };
    }

    try {
      await authService.login({ email, password });

      // Use startTransition for navigation
      startTransition(() => {
        navigate("/dashboard");
      });

      return { success: true, errors: {} };
    } catch (error: unknown) {
      const apiError = error as ApiError;

      if (apiError.errors && Array.isArray(apiError.errors)) {
        const fieldErrors: Record<string, string> = {};
        apiError.errors.forEach((err) => {
          if (err.field) {
            fieldErrors[err.field] = translateError(err.message);
          }
        });
        return { success: false, errors: fieldErrors };
      }

      return {
        success: false,
        errors: {
          general: translateError(apiError.message || "auth:login.failed"),
        },
      };
    }
  }

  const [state, formAction, pending] = useActionState(loginAction, {
    success: false,
    errors: {},
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
              <LockIcon className="size-6 text-white transition-transform duration-500 group-hover:-rotate-3" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("auth:login.title", "Welcome back")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {t("auth:login.subtitle", "Please enter your details to sign in")}
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
                <AlertCircleIcon className="size-5 shrink-0" />
                <span className="font-medium">{state.errors.general}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
                >
                  {t("auth:fields.email", "Email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  className="block w-full rounded-xl border-0 bg-slate-50/50 px-4 py-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white sm:text-sm sm:leading-6 transition-all duration-200"
                  placeholder={t("auth:placeholders.email", "Enter your email")}
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
                  {t("auth:fields.password", "Password")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
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
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-slate-600 cursor-pointer select-none"
                >
                  {t("auth:login.rememberMe", "Remember me")}
                </label>
              </div>
              <a
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {t("auth:login.forgotPassword", "Forgot password?")}
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="animate-spin size-5 text-white/50" />
                  <span>{t("auth:login.signingIn", "Signing in...")}</span>
                </>
              ) : (
                <>
                  <span>{t("auth:login.submit", "Sign in")}</span>
                  <ArrowRightIcon className="size-4 text-white/50 group-hover:translate-x-0.5 transition-transform duration-200" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                {t("auth:login.noAccount", "Don't have an account?")}{" "}
                <a
                  href="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  {t("auth:login.createAccount", "Create an account")}
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
