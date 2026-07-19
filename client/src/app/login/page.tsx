"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { label: "Admin Demo", email: "admin@demo.toolbazaar.dev" },
  { label: "Seller Demo", email: "seller@demo.toolbazaar.dev" },
  { label: "Buyer Demo", email: "buyer@demo.toolbazaar.dev" },
] as const;
const DEMO_PASSWORD = "Demo1234!";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingDemo, setPendingDemo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function doSignIn(email: string, password: string) {
    setServerError(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setServerError(error.message ?? "Sign in failed");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  const onSubmit = handleSubmit(({ email, password }) => doSignIn(email, password));

  async function handleDemoLogin(email: string) {
    setValue("email", email);
    setValue("password", DEMO_PASSWORD);
    setPendingDemo(email);
    await doSignIn(email, DEMO_PASSWORD);
    setPendingDemo(null);
  }

  async function handleGoogleLogin() {
    await authClient.signIn.social({ provider: "google", callbackURL: redirectTo });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-950">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Log in to ToolBazaar
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Buy, sell, and manage tools from one place.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-xs text-neutral-400">or</span>
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Continue with Google
        </button>

        <div className="mt-6">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-neutral-400">
            Quick demo access
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => handleDemoLogin(demo.email)}
                disabled={pendingDemo !== null}
                className="rounded-lg border border-orange-300 bg-orange-50 px-2 py-2 text-xs font-medium text-orange-700 transition hover:bg-orange-100 disabled:opacity-60 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300"
              >
                {pendingDemo === demo.email ? "…" : demo.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No account?{" "}
          <Link href="/register" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
