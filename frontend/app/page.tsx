"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Database,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
} from "lucide-react";
import {
  createAdminApiKey,
  deleteAdminApiKey,
  getAdminApiKeys,
  getAdminOverview,
  getAdminUsers,
  updateAdminApiKey,
  type AdminApiKey,
  type AdminOverview,
  type AdminUser,
} from "@/lib/api";
import { getSession } from "@/lib/auth";

type NewApiKeyForm = {
  service: "groq" | "mistral";
  name: string;
  key_value: string;
  weight: number;
  is_enabled: boolean;
};

const emptyKey: NewApiKeyForm = {
  service: "groq" as const,
  name: "",
  key_value: "",
  weight: 1,
  is_enabled: true,
};

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.22)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-950">
          <Icon size={17} />
        </div>
        <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-2.5 py-1 text-[11px] font-semibold text-teal-100">
          Live
        </span>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">{label}</p>
    </motion.div>
  );
}

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState(emptyKey);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = typeof window !== "undefined" ? getSession() : null;

  const groupedKeys = useMemo(() => {
    return {
      groq: keys.filter((key) => key.service === "groq"),
      mistral: keys.filter((key) => key.service === "mistral"),
    };
  }, [keys]);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [nextOverview, nextKeys, nextUsers] = await Promise.all([
        getAdminOverview(),
        getAdminApiKeys(),
        getAdminUsers(),
      ]);
      setOverview(nextOverview);
      setKeys(nextKeys);
      setUsers(nextUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin data failed to load.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createAdminApiKey(form);
      setForm(emptyKey);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create API key.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleKey(key: AdminApiKey) {
    await updateAdminApiKey(key.id, { is_enabled: !key.is_enabled });
    await refresh();
  }

  async function changeWeight(key: AdminApiKey, weight: number) {
    await updateAdminApiKey(key.id, { weight });
    await refresh();
  }

  async function removeKey(key: AdminApiKey) {
    await deleteAdminApiKey(key.id);
    await refresh();
  }

  return (
    <main className="premium-shell min-h-screen px-4 py-6 sm:px-6">
      <div aria-hidden className="mesh-line pointer-events-none fixed inset-0 opacity-30" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-950 shadow-[0_0_50px_rgba(196,181,253,0.22)]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-white">Ragora Admin</p>
              <p className="mt-1 text-sm text-slate-500">
                API key rotation, system load, users, and operations control.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {session?.user.email && (
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300">
                {session.user.email}
              </span>
            )}
            <button onClick={refresh} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white hover:bg-white/[0.085]">
              <RefreshCw size={15} />
              Refresh
            </button>
            <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-violet-100">
              <ArrowLeft size={15} />
              Dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid min-h-[50vh] place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-200" />
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={Users} label="Users" value={overview?.users ?? 0} />
              <Metric icon={ShieldCheck} label="Admins" value={overview?.admins ?? 0} />
              <Metric icon={Database} label="Ready documents" value={`${overview?.ready_documents ?? 0}/${overview?.documents ?? 0}`} />
              <Metric icon={RefreshCw} label="Processing docs" value={overview?.processing_documents ?? 0} />
              <Metric icon={Activity} label="Failed docs" value={overview?.failed_documents ?? 0} />
              <Metric icon={Sparkles} label="Indexed chunks" value={overview?.chunks ?? 0} />
              <Metric icon={Bot} label="Playground chats" value={overview?.chats ?? 0} />
              <Metric icon={Bot} label="Live widgets" value={`${overview?.live_widgets ?? 0}/${overview?.widgets ?? 0}`} />
              <Metric icon={Activity} label="Widget messages" value={overview?.widget_messages ?? 0} />
              <Metric icon={KeyRound} label="Enabled keys" value={`${overview?.enabled_api_keys ?? 0}/${overview?.api_keys ?? 0}`} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
              <form onSubmit={handleCreate} className="glass h-fit rounded-xl p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-950">
                    <Plus size={17} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Add provider key</p>
                    <p className="text-xs text-slate-500">Keys rotate randomly with weight-based load split.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <select className="auth-input" value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value as "groq" | "mistral" })}>
                    <option value="groq">Groq LLM</option>
                    <option value="mistral">Mistral Embeddings</option>
                  </select>
                  <input className="auth-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Production key 1" required />
                  <input className="auth-input" value={form.key_value} onChange={(event) => setForm({ ...form, key_value: event.target.value })} placeholder="Paste API key" required />
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">Rotation weight: {form.weight}</span>
                    <input type="range" min={1} max={20} value={form.weight} onChange={(event) => setForm({ ...form, weight: Number(event.target.value) })} className="w-full accent-violet-300" />
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-slate-300">
                    <input type="checkbox" checked={form.is_enabled} onChange={(event) => setForm({ ...form, is_enabled: event.target.checked })} className="accent-violet-300" />
                    Enable immediately
                  </label>
                  <button disabled={saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white font-semibold text-slate-950 hover:bg-violet-100 disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound size={16} />}
                    Save key
                  </button>
                </div>
              </form>

              <div className="space-y-5">
                {(["groq", "mistral"] as const).map((service) => (
                  <section key={service} className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold capitalize text-white">{service} key pool</p>
                        <p className="text-sm text-slate-500">
                          {service === "groq" ? "Used for answer generation and streaming." : "Used for document and query embeddings."}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
                        {groupedKeys[service].filter((key) => key.is_enabled).length} enabled
                      </span>
                    </div>
                    <div className="space-y-2">
                      {groupedKeys[service].length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-4 text-sm text-slate-500">
                          No keys yet. Ragora will fall back to the environment key until you add one.
                        </div>
                      ) : (
                        groupedKeys[service].map((key) => (
                          <div key={key.id} className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/45 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-white">{key.name}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${key.is_enabled ? "border border-teal-300/20 bg-teal-300/10 text-teal-100" : "border border-white/10 bg-white/5 text-slate-500"}`}>
                                  {key.is_enabled ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                              <p className="font-mono text-xs text-slate-500">{key.key_value}</p>
                              {key.last_error && <p className="mt-2 line-clamp-2 text-xs text-rose-200">{key.last_error}</p>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-300">
                                {key.usage_count} uses
                              </span>
                              <span className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-300">
                                {key.failure_count} fails
                              </span>
                              <select value={key.weight} onChange={(event) => changeWeight(key, Number(event.target.value))} className="h-9 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs text-slate-200">
                                {[1, 2, 3, 5, 8, 13, 20].map((weight) => <option key={weight} value={weight}>w{weight}</option>)}
                              </select>
                              <button onClick={() => toggleKey(key)} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-slate-200 hover:bg-white/[0.08]" aria-label="Toggle key">
                                {key.is_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                              </button>
                              <button onClick={() => removeKey(key)} className="grid h-9 w-9 place-items-center rounded-lg border border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15" aria-label="Delete key">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-200" />
                  <div>
                    <p className="font-semibold text-white">Supabase Auth users</p>
                    <p className="text-xs text-slate-500">Users are listed from Authentication and enriched with workspace data when available.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">{users.length} auth users</span>
                  <span className="rounded-lg border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs text-teal-100">{users.filter((user) => user.email_verified).length} verified</span>
                  <span className="rounded-lg border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs text-violet-100">{users.filter((user) => user.is_admin).length} admins</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.04em] text-slate-500">
                    <tr>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Workspace</th>
                      <th className="pb-3">Provider</th>
                      <th className="pb-3">Verified</th>
                      <th className="pb-3">Admin</th>
                      <th className="pb-3">Last sign in</th>
                      <th className="pb-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.slice(0, 12).map((user) => (
                      <tr key={user.id}>
                        <td className="py-3">
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </td>
                        <td className="py-3 text-slate-300">{user.workspace}</td>
                        <td className="py-3 capitalize text-slate-400">{user.provider}</td>
                        <td className="py-3">{user.email_verified ? <CheckCircle2 className="h-4 w-4 text-teal-300" /> : <span className="text-slate-600">No</span>}</td>
                        <td className="py-3">{user.is_admin ? <ShieldCheck className="h-4 w-4 text-violet-200" /> : <span className="text-slate-600">No</span>}</td>
                        <td className="py-3 text-slate-400">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}</td>
                        <td className="py-3"><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300">{user.source || "auth"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
