"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bot,
  ChevronRight,
  Command,
  FileStack,
  LogOut,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { ChatInterface } from "@/components/ChatInterface";
import { DocumentList } from "@/components/DocumentList";
import { FileUpload } from "@/components/FileUpload";
// import { HistorySidebar } from "@/components/HistorySidebar";
import { WidgetEmbed } from "@/components/WidgetEmbed";
import { WidgetHistoryPanel } from "@/components/WidgetHistoryPanel";
import type { ChatMessage, DocumentItem, WidgetAnalytics, WidgetHistory } from "@/lib/api";
import { deleteDocument, getAnalytics, getDocuments, getHistory, getWidgetHistory } from "@/lib/api";
import { clearSession, getSession } from "@/lib/auth";

type View = "overview" | "builder" | "playground";

const NAV_ITEMS: { id: View; label: string; icon: typeof BarChart3; description: string }[] = [
  { id: "overview", label: "Overview", icon: BarChart3, description: "Analytics, coverage, and live demand" },
  { id: "builder", label: "Builder", icon: Bot, description: "Design and deploy your chatbot" },
  { id: "playground", label: "Playground", icon: MessageCircle, description: "Test answer quality against sources" },
];

const viewMotion = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(6px)" },
};

function InsightCard({
  icon: Icon,
  label,
  value,
  tone,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  tone: string;
  detail: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
    >
      <div className={`absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent ${tone} to-transparent`} />
      <div className="mb-4 flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.07]">
          <Icon size={17} className="text-white" />
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-medium text-slate-400">Live</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">{label}</p>
      <p className="mt-3 text-xs leading-5 text-slate-400">{detail}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [analytics, setAnalytics] = useState<WidgetAnalytics | null>(null);
  const [widgetHistory, setWidgetHistory] = useState<WidgetHistory | null>(null);
  const [activeView, setActiveView] = useState<View>("overview");
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const currentView = NAV_ITEMS.find((n) => n.id === activeView) ?? NAV_ITEMS[0];

  useEffect(() => {
    const session = getSession();
    const stored = session?.user.workspace || localStorage.getItem("rag_user_id");
    if (!stored) { router.replace("/login"); return; }
    setUserId(stored);
    setIsAdmin(Boolean(session?.user.is_admin));
    setIsReady(true);
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    void refreshAll(userId);
  }, [userId]);

  async function refreshAll(uid = userId) {
    if (!uid) return;
    const [history, docs, stats, wh] = await Promise.allSettled([
      getHistory(uid), getDocuments(uid), getAnalytics(uid), getWidgetHistory(uid),
    ] as const);
    if (history.status === "fulfilled") setMessages(history.value);
    if (docs.status === "fulfilled") setDocuments(docs.value);
    if (stats.status === "fulfilled") setAnalytics(stats.value);
    if (wh.status === "fulfilled") setWidgetHistory(wh.value);
  }

  async function handleDeleteDocument(docId: string) {
    if (!userId) return;
    await deleteDocument(userId, docId);
    setDocuments((c) => c.filter((d) => d.id !== docId));
  }

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (!isReady || !userId) return <div className="premium-shell min-h-screen" />;

  return (
    <div className="premium-shell" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div aria-hidden className="mesh-line pointer-events-none fixed inset-0 opacity-30" />

      {/* ── Left rail: Chat history (lg+) ── */}
      {/* <HistorySidebar messages={messages} /> */}

      {/* ── Document sidebar (xl+) ── */}
      <div
        className="hidden xl:flex"
        style={{
          width: 272,
          flexShrink: 0,
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(6,7,12,0.74)",
          backdropFilter: "blur(24px)",
          padding: "1.25rem 1rem",
          gap: "0",
          overflowY: "auto",
          height: "100vh",
        }}
      >
        {/* Workspace header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fff", color: "#07080d", display: "grid", placeItems: "center", boxShadow: "0 0 32px rgba(196,181,253,0.28)" }}>
              <Sparkles size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Ragora
              </p>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>{userId}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem", paddingLeft: "0.25rem" }}>
            Console
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className="group relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-left text-sm font-medium transition"
                style={active ? { background: "rgba(139,92,246,0.16)", color: "#ddd6fe", marginBottom: "0.25rem" } : { color: "var(--text-secondary)", marginBottom: "0.25rem" }}
              >
                {active && <motion.span layoutId="dashboard-nav-active" className="absolute inset-y-1 left-1 w-1 rounded-full bg-violet-200" />}
                <Icon size={15} />
                <span className="flex-1">
                  <span className="block">{item.label}</span>
                  <span className="mt-0.5 hidden text-[11px] font-normal leading-4 text-slate-500 2xl:block">{item.description}</span>
                </span>
                {active && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />}
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3" style={{ marginBottom: "1.25rem" }}>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-teal-100">
            <ShieldCheck size={14} />
            Auth secured
          </div>
          <p className="text-xs leading-5 text-slate-400">JWT access tokens and rotated refresh sessions protect this workspace.</p>
        </div>

        {/* Documents */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <FileUpload userId={userId} onUploaded={() => refreshAll(userId)} />
          <DocumentList documents={documents} onDelete={handleDeleteDocument} />
        </div>

        {/* Logout */}
        <div className="divider" style={{ margin: "1rem 0 0.875rem" }} />
        <button
          type="button"
          onClick={logout}
          className="nav-item"
          style={{ color: "var(--text-tertiary)" }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top bar */}
        <header
          className="relative z-10 border-b border-white/10 bg-slate-950/60 px-4 backdrop-blur-2xl sm:px-6"
          style={{ height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}
        >
          {/* Breadcrumb */}
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Command size={13} />
              <span>Ragora Console</span>
              <ChevronRight size={12} />
              <span className="font-semibold text-slate-300">{currentView.label}</span>
            </div>
            <p className="hidden truncate text-sm text-slate-400 md:block">{currentView.description}</p>
          </div>

          {/* Tab switcher (mobile/tablet, always visible) */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.055)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 10,
              padding: "3px",
              gap: 2,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  style={{
                    height: 32,
                    padding: "0 0.75rem",
                    borderRadius: 7,
                    border: "none",
                    background: active ? "#ffffff" : "transparent",
                    color: active ? "#07080d" : "var(--text-secondary)",
                    fontSize: "0.8125rem",
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    transition: "background 0.15s, color 0.15s",
                    boxShadow: active ? "0 12px 34px rgba(255,255,255,0.12)" : "none",
                  }}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              className="hidden md:flex"
              style={{ alignItems: "center", gap: "0.5rem" }}
            >
              {isAdmin && (
                <Link href="/admin" className="rounded-lg border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-semibold text-violet-100 hover:bg-violet-300/15">
                  Admin
                </Link>
              )}
              <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-2.5 py-1 text-[11px] font-semibold text-teal-100">Secure</span>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "var(--surface-3)",
                  border: "1px solid var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--accent-light)",
                }}
              >
                {userId.slice(0, 2).toUpperCase()}
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 500 }}>{userId}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn-ghost"
              style={{ height: 32, width: 32, padding: 0, display: "grid", placeItems: "center" }}
              aria-label="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <AnimatePresence mode="wait">
          {/* Overview */}
          {activeView === "overview" && (
            <motion.div
              key="overview"
              {...viewMotion}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ padding: "1.5rem" }}
            >
              {/* Mobile-only: upload/docs */}
              <div className="xl:hidden" style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="card" style={{ padding: "1.125rem" }}>
                  <FileUpload userId={userId} onUploaded={() => refreshAll(userId)} />
                  <DocumentList documents={documents} onDelete={handleDeleteDocument} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.34, ease: "easeOut" }}
                  className="glass relative overflow-hidden rounded-xl p-5 sm:p-6"
                >
                  <div aria-hidden className="absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />
                  <div aria-hidden className="absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-teal-300/10 blur-3xl" />
                  <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-100">
                        <Zap size={13} />
                        Live knowledge operations
                      </div>
                      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">Your AI knowledge command center</h1>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        Ragora is watching source coverage, customer questions, answer gaps, and widget readiness for <span className="font-semibold text-slate-200">{userId}</span>.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setActiveView("builder")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-violet-100">
                          <Rocket size={15} />
                          Deploy widget
                        </button>
                        <button type="button" onClick={() => setActiveView("playground")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.085]">
                          <MessageCircle size={15} />
                          Test answers
                        </button>
                      </div>
                    </div>
                    <div className="grid min-w-full grid-cols-3 gap-2 text-center sm:min-w-[360px]">
                      <div className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
                        <p className="text-xl font-semibold text-white">{documents.length}</p>
                        <p className="text-[11px] text-slate-500">Sources</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
                        <p className="text-xl font-semibold text-white">{analytics?.unique_visitors ?? 0}</p>
                        <p className="text-[11px] text-slate-500">Visitors</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
                        <p className="text-xl font-semibold text-white">{analytics?.average_latency_ms ?? 0}ms</p>
                        <p className="text-[11px] text-slate-500">Latency</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                <div className="grid gap-3 lg:grid-cols-3">
                  <InsightCard icon={FileStack} label="Knowledge coverage" value={`${documents.length} files`} tone="via-violet-300/70" detail="Add more source documents to improve answer depth and reduce unknowns." />
                  <InsightCard icon={Activity} label="Answer demand" value={analytics?.user_messages ?? 0} tone="via-teal-300/70" detail="Customer and tester questions collected from your embedded assistant." />
                  <InsightCard icon={ShieldCheck} label="Trust layer" value="JWT" tone="via-sky-300/70" detail="Workspace APIs are protected with bearer tokens and server-side ownership checks." />
                </div>
                {/* Section label */}
                <div>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Analytics</h2>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: "0.125rem" }}>
                    Performance metrics for your embedded chatbots
                  </p>
                </div>
                <AnalyticsPanel analytics={analytics} />

                <div style={{ marginTop: "0.5rem" }}>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.125rem" }}>Live Sessions</h2>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "1rem" }}>
                    Real-time visitor conversations from your embedded widget
                  </p>
                  <WidgetHistoryPanel history={widgetHistory} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Builder */}
          {activeView === "builder" && (
            <motion.div
              key="builder"
              {...viewMotion}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ padding: "1.5rem" }}
            >
              {/* Mobile-only docs */}
              <div className="xl:hidden" style={{ marginBottom: "1.25rem" }}>
                <div className="card" style={{ padding: "1.125rem" }}>
                  <FileUpload userId={userId} onUploaded={() => refreshAll(userId)} />
                  <DocumentList documents={documents} onDelete={handleDeleteDocument} />
                </div>
              </div>
              <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.035] p-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
                  <Bot size={13} />
                  Widget studio
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Design a customer-facing AI assistant</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Tune the widget’s brand, tone, instructions, and install script in one place.
                </p>
              </div>
              <WidgetEmbed userId={userId} />
            </motion.div>
          )}

          {/* Playground */}
          {activeView === "playground" && (
            <motion.div
              key="playground"
              {...viewMotion}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ height: "calc(100vh - 68px)", display: "flex", flexDirection: "column" }}
            >
              <ChatInterface
                userId={userId}
                messages={messages}
                documents={documents}
                onMessagesChange={setMessages}
                onRefreshHistory={() => refreshAll(userId)}
              />
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
