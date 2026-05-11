"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Github, Loader2, Sparkles } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  completeSupabaseRedirect,
  forgotPassword,
  loginWithEmail,
  loginWithGithub,
  loginWithGoogle,
  resetPassword,
  signupWithEmail,
} from "@/lib/auth";

type Mode = "login" | "signup" | "forgot" | "reset" | "verify";

type AuthPanelProps = {
  mode: Mode;
};

const modeCopy: Record<Mode, { title: string; description: string; cta: string }> = {
  login: {
    title: "Log in",
    description: "Welcome back to Ragora.",
    cta: "Log in",
  },
  signup: {
    title: "Create account",
    description: "Start your Ragora workspace.",
    cta: "Sign up",
  },
  forgot: {
    title: "Reset password",
    description: "Enter your email to receive a reset link.",
    cta: "Send reset link",
  },
  reset: {
    title: "New password",
    description: "Choose a new password for your account.",
    cta: "Update password",
  },
  verify: {
    title: "Confirm email",
    description: "Open the confirmation link from your inbox.",
    cta: "Back to login",
  },
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-.8 2.3-1.8 3v2.5h2.9c1.7-1.6 2.7-3.9 2.7-6.7 0-.6-.1-1.1-.2-1.6H12z" />
      <path fill="#34A853" d="M6.4 14.3l-.7.5-2.3 1.8C4.9 19.7 8.1 22 12 22c2.4 0 4.5-.8 6-2.2l-2.9-2.5c-.8.5-1.8.9-3.1.9-2.3 0-4.3-1.6-5-3.7z" />
      <path fill="#4A90E2" d="M3.4 7.4C2.5 9 2.5 11.5 3.4 13.1l3.6-2.8c-.2-.5-.3-1-.3-1.6s.1-1.1.3-1.6z" />
      <path fill="#FBBC05" d="M12 5.8c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.5 3 14.4 2 12 2 8.1 2 4.9 4.3 3.4 7.4L7 10.2c.7-2.1 2.7-4.4 5-4.4z" />
    </svg>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    return [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-3 grid grid-cols-4 gap-1.5">
      {[0, 1, 2, 3].map((step) => (
        <span key={step} className={`h-1.5 rounded-full ${step < score ? "bg-teal-300" : "bg-white/10"}`} />
      ))}
    </div>
  );
}

function AuthProviderButton({ children, onSelect, disabled = false }: { children: ReactNode; onSelect: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const copy = modeCopy[mode];
  const isAuthMode = mode === "login" || mode === "signup";

  useEffect(() => {
    if (mode !== "reset") return;
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code && !window.location.hash.includes("access_token=")) return;
    void completeSupabaseRedirect(code).catch((error) => {
      setMessage(error instanceof Error ? error.message : "Reset link could not be verified.");
    });
  }, [mode]);

  async function handleOAuth(provider: "google" | "github") {
    setLoading(true);
    setMessage(null);
    try {
      if (provider === "google") await loginWithGoogle();
      else await loginWithGithub();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${provider} sign in failed.`);
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "login") {
        const session = await loginWithEmail(email, password);
        router.push(session.user.is_admin ? "/admin" : "/dashboard");
        return;
      }
      if (mode === "signup") {
        const result = await signupWithEmail(name, email, password);
        if ("needsEmailConfirmation" in result) {
          setMessage("Check your email and open the confirmation link.");
          return;
        }
        router.push("/dashboard");
        return;
      }
      if (mode === "forgot") {
        const response = await forgotPassword(email);
        setMessage(response.message);
        return;
      }
      if (mode === "reset") {
        const response = await resetPassword("manual-reset-token", password);
        setMessage(response.message);
        window.setTimeout(() => router.push("/login"), 850);
        return;
      }
      if (mode === "verify") {
        router.push("/login");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="premium-shell grid min-h-screen place-items-center px-4 py-8">
      <div aria-hidden className="mesh-line pointer-events-none fixed inset-0 opacity-20" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-sm font-semibold text-slate-200">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-950">
            <Sparkles size={16} />
          </span>
          Ragora
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-7"
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{copy.title}</h1>
            <p className="mt-2 text-sm text-slate-400">{copy.description}</p>
          </div>

          {isAuthMode && (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <AuthProviderButton onSelect={() => handleOAuth("google")} disabled={loading}>
                  <GoogleIcon />
                  Google
                </AuthProviderButton>
                <AuthProviderButton onSelect={() => handleOAuth("github")} disabled={loading}>
                  <Github size={16} />
                  GitHub
                </AuthProviderButton>
              </div>
              <div className="my-5 flex items-center gap-3 text-xs uppercase text-slate-500">
                <span className="h-px flex-1 bg-white/10" />
                or
                <span className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Name</span>
                <input className="auth-input h-11" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" required />
              </label>
            )}

            {mode !== "reset" && mode !== "verify" && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
                <input className="auth-input h-11" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@company.com" autoComplete="email" required />
              </label>
            )}

            {(mode === "login" || mode === "signup" || mode === "reset") && (
              <label className="block">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="block text-sm font-medium text-slate-300">Password</span>
                  {mode === "login" && <Link className="text-xs font-semibold text-violet-200 hover:text-white" href="/forgot-password">Forgot?</Link>}
                </div>
                <input className="auth-input h-11" value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
                {(mode === "signup" || mode === "reset") && <PasswordStrength password={password} />}
              </label>
            )}

            {mode === "verify" && (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-300">
                Open the confirmation link from Supabase Auth. After confirmation, sign in.
              </div>
            )}

            <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white font-semibold text-slate-950 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.cta}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-lg border border-teal-300/20 bg-teal-300/10 px-4 py-3 text-sm text-teal-100">
              {message}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
            {mode === "login" && (
              <>
                <span>Need an account?</span>
                <Link className="font-semibold text-violet-200 hover:text-white" href="/signup">Sign up</Link>
              </>
            )}
            {mode === "signup" && (
              <>
                <span>Already registered?</span>
                <Link className="font-semibold text-violet-200 hover:text-white" href="/login">Log in</Link>
              </>
            )}
            {(mode === "forgot" || mode === "reset" || mode === "verify") && <Link className="font-semibold text-violet-200 hover:text-white" href="/login">Back to login</Link>}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
