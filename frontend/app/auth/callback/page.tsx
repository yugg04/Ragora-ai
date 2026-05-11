"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { completeSupabaseRedirect } from "@/lib/auth";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing secure sign in...");

  useEffect(() => {
    async function finish() {
      try {
        const code = searchParams.get("code");
        const session = await completeSupabaseRedirect(code);
        router.replace(session.user.is_admin ? "/admin" : "/dashboard");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Authentication failed.");
        window.history.replaceState(null, "", "/login");
        window.setTimeout(() => router.replace("/login"), 2200);
      }
    }

    void finish();
  }, [router, searchParams]);

  return (
    <main className="premium-shell grid min-h-screen place-items-center px-4">
      <div className="glass flex w-full max-w-sm flex-col items-center rounded-xl p-8 text-center">
        <Loader2 className="mb-4 h-7 w-7 animate-spin text-violet-200" />
        <p className="text-sm font-semibold text-white">{message}</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="premium-shell grid min-h-screen place-items-center px-4">
        <div className="glass flex w-full max-w-sm flex-col items-center rounded-xl p-8 text-center">
          <Loader2 className="mb-4 h-7 w-7 animate-spin text-violet-200" />
          <p className="text-sm font-semibold text-white">Finishing secure sign in...</p>
        </div>
      </main>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
