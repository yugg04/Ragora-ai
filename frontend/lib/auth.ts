import { isSupabaseAuthConfigured, supabase } from "@/lib/supabase";

export type AuthProvider = "email" | "google" | "github";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  workspace: string;
  provider: AuthProvider;
  avatar_url?: string;
  email_verified: boolean;
  is_admin?: boolean;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  user: AuthUser;
};

const SESSION_KEY = "ragora_session";
const LEGACY_USER_KEY = "rag_user_id";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const PKCE_STORAGE_ERROR = "PKCE code verifier not found";

async function readError(response: Response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return typeof parsed.detail === "string" ? parsed.detail : text;
  } catch {
    return text || `Request failed with ${response.status}`;
  }
}

async function authRequest<T>(path: string, body: unknown, authenticated = false): Promise<T> {
  const token = authenticated ? getAccessToken() : "";
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<T>;
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(LEGACY_USER_KEY, session.user.workspace);
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.access_token || !session.user?.workspace) return null;
    return session;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return getSession()?.access_token ?? "";
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
  if (isSupabaseAuthConfigured) void supabase.auth.signOut();
}

async function bridgeSupabaseAccessToken(accessToken: string) {
  const session = await authRequest<AuthSession>("/auth/supabase", { access_token: accessToken });
  saveSession(session);
  return session;
}

function requireSupabaseAuth() {
  if (!isSupabaseAuthConfigured) {
    throw new Error("Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

async function loginWithBackendEmail(email: string, password: string) {
  const session = await authRequest<AuthSession>("/auth/login", { email, password });
  saveSession(session);
  return session;
}

function isPkceStorageError(error: unknown) {
  return error instanceof Error && error.message.includes(PKCE_STORAGE_ERROR);
}

function staleAuthLinkError() {
  return new Error("This sign-in link is no longer valid in this browser. Please sign in again from this page.");
}

export async function finishSupabaseAuth() {
  requireSupabaseAuth();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw isPkceStorageError(error) ? staleAuthLinkError() : new Error(error.message);
  if (!data.session?.access_token) throw new Error("No Supabase session found.");
  return bridgeSupabaseAccessToken(data.session.access_token);
}

export async function exchangeSupabaseCode(code: string | null) {
  requireSupabaseAuth();
  if (!code) return;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw isPkceStorageError(error) ? staleAuthLinkError() : new Error(error.message);
}

export async function completeSupabaseRedirect(code: string | null) {
  if (code) {
    await exchangeSupabaseCode(code);
  }
  return finishSupabaseAuth();
}

export async function loginWithEmail(email: string, password: string) {
  if (!isSupabaseAuthConfigured) {
    return loginWithBackendEmail(email, password);
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return loginWithBackendEmail(email, password);
  }
  if (!data.session?.access_token) throw new Error("Please confirm your email before signing in.");
  return bridgeSupabaseAccessToken(data.session.access_token);
}

export async function signupWithEmail(name: string, email: string, password: string) {
  requireSupabaseAuth();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
  if (!data.session?.access_token) {
    return { needsEmailConfirmation: true };
  }
  return bridgeSupabaseAccessToken(data.session.access_token);
}

export async function loginWithGoogle() {
  requireSupabaseAuth();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function loginWithGithub() {
  requireSupabaseAuth();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
}

export async function forgotPassword(email: string) {
  requireSupabaseAuth();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
  return { ok: true, message: "If that email exists, Supabase sent a reset link." };
}

export async function resetPassword(_token: string, password: string) {
  requireSupabaseAuth();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  return { ok: true, message: "Password updated. You can sign in now." };
}

export async function verifyEmail(code: string) {
  return authRequest<{ ok: boolean; message: string }>("/auth/verify-email", { code }, true);
}
