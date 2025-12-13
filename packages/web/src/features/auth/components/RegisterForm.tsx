import { useActionState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../services/auth.service";
import { registerUserSchema } from "@auth/utils/validation";
import { VALIDATION_RULES } from "@auth/utils/constants";
import {
  UserPlusIcon,
  AlertCircleIcon,
  SpinnerIcon,
  ArrowRightIcon,
} from "../../../shared/components/icons";

interface FormState {
  success: boolean;
  errors: Record<string, string>;
  defaultValues?: {
    name: string;
    email: string;
  };
}

interface ValidationError {
  path: (string | number | symbol)[];
  message: string;
}

interface ApiError {
  errors?: Array<{ field?: string; message: string }>;
  message?: string;
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation(["auth", "validation"]);

  // Helper to translate error messages
  const translateError = (message: string): string => {
    // If message contains ':', it's a translation key
    if (message && message.includes(":")) {
      return t(message);
    }
    return message;
  };

  // Form action handler following React 19 patterns
  async function registerAction(
    _prevState: FormState,
    formData: FormData
  ): Promise<FormState> {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Client-side validation using shared schema
    const validation = registerUserSchema.safeParse({ name, email, password });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err: ValidationError) => {
        const field = err.path[0] as string;
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
    } catch (error: unknown) {
      const apiError = error as ApiError;

      if (apiError.errors && Array.isArray(apiError.errors)) {
        const fieldErrors: Record<string, string> = {};
        apiError.errors.forEach((err) => {
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
          general: translateError(apiError.message || "auth:register.failed"),
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
              <UserPlusIcon className="size-6 text-white transition-transform duration-500 group-hover:-rotate-3" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("auth:register.title", "Create an account")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {t("auth:register.subtitle", "Enter your details to get started")}
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
              {/* Name Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
                >
                  {t("auth:fields.name", "Full Name")}
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
                  placeholder={t("auth:placeholders.name", "John Doe")}
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
                  {t("auth:fields.email", "Email")}
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
                  placeholder={t("auth:placeholders.email", "you@example.com")}
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
                  {t(
                    "auth:register.passwordRequirements",
                    `Must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters with uppercase, lowercase, number, and special character`
                  )}
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
                  <SpinnerIcon className="animate-spin size-5 text-white/50" />
                  <span>
                    {t("auth:register.creatingAccount", "Creating account...")}
                  </span>
                </>
              ) : (
                <>
                  <span>{t("auth:register.submit", "Create account")}</span>
                  <ArrowRightIcon className="size-4 text-white/50 group-hover:translate-x-0.5 transition-transform duration-200" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                {t("auth:register.hasAccount", "Already have an account?")}{" "}
                <a
                  href="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  {t("auth:register.signIn", "Sign in")}
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
