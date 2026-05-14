"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Check, Copy, Loader2, MessageCircle, Palette, Sparkles, SlidersHorizontal, UploadCloud, X } from "lucide-react";
import type { WidgetConfig } from "@/lib/api";
import { getWidget, saveWidget, uploadWidgetLogo } from "@/lib/api";

type Props = { userId: string };
type WidgetForm = Omit<WidgetConfig, "widget_id" | "embed_script">;

const DEFAULT_WIDGET = {
  title: "Ask AI",
  welcome_message: "Hi. Ask me anything from these documents.",
  theme: "dark" as const,
  accent_color: "#6366f1",
  secondary_color: "#0f172a",
  logo_url: "",
  icon_label: "AI",
  company_name: "",
  company_site: "",
  company_email: "",
  launcher_style: "pill" as const,
  launcher_circle_size: 60,
  launcher_pill_size: 56,
  border_radius: 14,
  launcher_label: "Chat with AI",
  input_placeholder: "Ask a question",
  position: "bottom-right" as const,
  bot_goal: "Answer visitor questions using the uploaded documents.",
  bot_role: "customer_support",
  tone: "professional",
  custom_instructions: "",
  fallback_message: "I do not know based on the provided documents.",
  collect_leads: false,
  is_enabled: true,
};

const TEMPLATES = [
  { name: "Customer Care", role: "customer_support", goal: "Help website visitors understand services, answer common questions, collect issue details, and guide them to the right next step.", welcome: "Hi. I can help with questions about our services, support, and next steps.", fallback: "I do not have that information yet. Please share your email or contact support.", color: "#6366f1" },
  { name: "HR Policies", role: "hr_policy_assistant", goal: "Help employees understand HR policies, benefits, leave rules, onboarding steps, and internal process guidance.", welcome: "Hi. Ask me about HR policies, benefits, leave, or onboarding.", fallback: "I cannot confirm that from the available policy information. Please contact HR.", color: "#8b5cf6" },
  { name: "Sales Assistant", role: "sales_assistant", goal: "Qualify leads, explain offerings, answer product questions, and encourage visitors to book a demo.", welcome: "Hi. I can help you find the right solution or book a demo.", fallback: "I do not have that detail yet. I can collect your contact details for the sales team.", color: "#0ea5e9" },
  { name: "Support Desk", role: "technical_support", goal: "Troubleshoot common product issues, ask clarifying questions, and escalate when the answer is not available.", welcome: "Hi. Tell me what is not working and I will help troubleshoot.", fallback: "I do not have a documented fix for that yet. Please share the error and contact details.", color: "#f59e0b" },
  { name: "Company FAQ", role: "internal_knowledge_base", goal: "Answer company, service, pricing, policy, and process FAQs.", welcome: "Hi. Ask me anything from this company's FAQ and documents.", fallback: "I do not know that from the available information yet.", color: "#10b981" },
];

const PRESET_LOGOS = [
  { label: "Spark", initials: "AI", bg: "#6366f1", fg: "#ffffff", shape: "spark" },
  { label: "Support", initials: "S", bg: "#0ea5e9", fg: "#ffffff", shape: "chat" },
  { label: "Growth", initials: "G", bg: "#10b981", fg: "#052e1a", shape: "bolt" },
  { label: "Trust", initials: "T", bg: "#f59e0b", fg: "#241200", shape: "shield" },
  { label: "Docs", initials: "D", bg: "#8b5cf6", fg: "#ffffff", shape: "doc" },
];

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const MAX_LOGO_BYTES = 1_000_000;

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function readableTextColor(background: string) {
  if (!isHexColor(background)) return "#ffffff";
  const hex = background.slice(1);
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const transform = (channel: number) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
  return luminance > 0.52 ? "#061014" : "#ffffff";
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const color = isHexColor(value) ? value : "#6366f1";
  return (
    <label className="flex min-h-[42px] items-center gap-2 rounded-lg border border-white/10 bg-slate-950/35 px-2">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{ width: 30, height: 30, padding: 2, borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--surface-0)", cursor: "pointer" }}
      />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`)}
          onBlur={(e) => {
            if (!isHexColor(e.target.value)) onChange(color);
          }}
          className="w-24 bg-transparent font-mono text-xs text-slate-100 outline-none"
          spellCheck={false}
        />
      </div>
    </label>
  );
}

function LogoMark({ form, className }: { form: WidgetForm; className?: string }) {
  const [failedUrl, setFailedUrl] = useState("");
  const logoUrl = form.logo_url.trim();
  const showImage = logoUrl && failedUrl !== logoUrl;
  return showImage ? (
    <img src={logoUrl} alt="" className={className ?? "h-full w-full object-cover"} onError={() => setFailedUrl(logoUrl)} />
  ) : (
    <>{form.icon_label || "AI"}</>
  );
}

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${window.btoa(svg)}`;
}

function Section({ icon: Icon, title, description, children }: { icon: typeof Bot; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.06]">
          <Icon size={14} style={{ color: "var(--accent-light)" }} />
        </div>
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{title}</p>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>{children}</div>
    </div>
  );
}

function WidgetPreview({ form }: { form: WidgetForm }) {
  const isDark = form.theme === "dark";
  const accentText = readableTextColor(form.accent_color);
  const headerText = readableTextColor(form.secondary_color);
  const circleSize = clampNumber(form.launcher_circle_size ?? DEFAULT_WIDGET.launcher_circle_size, 44, 96);
  const pillSize = clampNumber(form.launcher_pill_size ?? DEFAULT_WIDGET.launcher_pill_size, 44, 80);
  const activeLauncherSize = form.launcher_style === "circle" ? circleSize : pillSize;
  return (
    <div className="sticky top-5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Live preview</p>
          <p className="mt-1 text-xs text-slate-500">How your assistant will feel on-site</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${form.is_enabled ? "border border-teal-300/20 bg-teal-300/10 text-teal-100" : "border border-white/10 bg-white/5 text-slate-400"}`}>
          {form.is_enabled ? "Live" : "Paused"}
        </span>
      </div>
      <div className="relative min-h-[470px] overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_30%_15%,rgba(45,212,191,0.14),transparent_14rem),radial-gradient(circle_at_85%_0%,rgba(99,102,241,0.18),transparent_16rem),linear-gradient(180deg,rgba(15,23,42,0.86),rgba(2,6,23,0.96))] p-4">
        <div className="absolute left-5 top-5 h-2 w-28 rounded-full bg-white/10" />
        <div className="absolute left-5 top-10 h-2 w-40 rounded-full bg-white/5" />
        <div className="absolute bottom-5 right-5">
          <div
            className="mb-3 w-[280px] overflow-hidden rounded-xl border shadow-2xl"
            style={{
              borderColor: "rgba(255,255,255,0.14)",
              background: isDark ? "#080b14" : "#f8fafc",
              color: isDark ? "#f8fafc" : "#0f172a",
              borderRadius: form.border_radius,
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: form.secondary_color, color: headerText }}>
              <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full text-xs font-bold" style={{ background: form.accent_color, color: accentText }}>
                <LogoMark form={form} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{form.title || "Ask AI"}</p>
                <p className="text-[11px] opacity-65">{form.company_name || "Answers from your knowledge base"}</p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className="max-w-[88%] rounded-lg bg-white/[0.08] px-3 py-2 text-xs leading-5">
                {form.welcome_message || "Hi. Ask me anything from these documents."}
              </div>
              <div className="ml-auto max-w-[78%] rounded-lg px-3 py-2 text-xs leading-5" style={{ background: form.accent_color, color: accentText }}>
                Can you summarize the onboarding policy?
              </div>
              <div className="max-w-[92%] rounded-lg bg-white/[0.08] px-3 py-2 text-xs leading-5">
                Yes. I found the key onboarding steps and can cite the uploaded source document.
              </div>
              <div className="max-w-[92%] rounded-lg bg-white/[0.08] px-3 py-2 text-xs leading-5">
                If I cannot answer, I will route visitors to {form.company_email || "your company email"}.
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-500">
                {form.input_placeholder || "Ask a question"}
              </div>
            </div>
            <div className="flex items-center justify-center border-t border-white/10 px-3 pb-2.5 pt-2">
              <div className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] py-1 pl-1 pr-2.5 text-[11px] leading-none opacity-80 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(2,6,23,0.14)]">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-teal-400 via-indigo-500 to-fuchsia-500 text-[11px] font-black text-white shadow-[0_6px_16px_rgba(99,102,241,0.34)]">R</span>
                <span className="font-semibold opacity-60">Powered by</span>
                <span className="font-black tracking-normal">Ragora.ai</span>
              </div>
            </div>
          </div>
          <div
            className="ml-auto flex items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold shadow-2xl"
            style={{
              background: form.accent_color,
              color: accentText,
              height: activeLauncherSize,
              minWidth: form.launcher_style === "circle" ? activeLauncherSize : Math.max(148, pillSize * 2.7),
              width: form.launcher_style === "circle" ? activeLauncherSize : undefined,
              paddingInline: form.launcher_style === "circle" ? 0 : Math.max(16, Math.round(pillSize * 0.34)),
            }}
          >
            <span
              className="grid place-items-center overflow-hidden rounded-full"
              style={{
                width: Math.max(30, Math.round(activeLauncherSize * 0.62)),
                height: Math.max(30, Math.round(activeLauncherSize * 0.62)),
                background: "rgba(255,255,255,0.38)",
              }}
            >
              {form.logo_url ? <LogoMark form={form} /> : <MessageCircle size={Math.max(16, Math.round(activeLauncherSize * 0.3))} />}
            </span>
            {form.launcher_style === "pill" && (form.launcher_label || "Chat with AI")}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WidgetEmbed({ userId }: Props) {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [widget, setWidget] = useState<WidgetConfig | null>(null);
  const [form, setForm] = useState<WidgetForm>({ user_id: userId, ...DEFAULT_WIDGET });
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((c) => ({ ...c, user_id: userId }));
    void loadWidget();
  }, [userId]);

  async function loadWidget() {
    const existing = await getWidget(userId);
    if (!existing) return;
    setWidget(existing);
    setForm({ user_id: userId, title: existing.title, welcome_message: existing.welcome_message, theme: existing.theme, accent_color: existing.accent_color, secondary_color: existing.secondary_color, logo_url: existing.logo_url, icon_label: existing.icon_label, company_name: existing.company_name || "", company_site: existing.company_site || "", company_email: existing.company_email || "", launcher_style: existing.launcher_style, launcher_circle_size: existing.launcher_circle_size ?? DEFAULT_WIDGET.launcher_circle_size, launcher_pill_size: existing.launcher_pill_size ?? DEFAULT_WIDGET.launcher_pill_size, border_radius: existing.border_radius, launcher_label: existing.launcher_label, input_placeholder: existing.input_placeholder, position: existing.position, bot_goal: existing.bot_goal, bot_role: existing.bot_role, tone: existing.tone, custom_instructions: existing.custom_instructions, fallback_message: existing.fallback_message, collect_leads: existing.collect_leads, is_enabled: existing.is_enabled });
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const fallback =
        form.company_email && !form.fallback_message.includes(form.company_email)
          ? `I do not know based on the provided documents. Please contact ${form.company_email} for help.`
          : form.fallback_message;
      const saved = await saveWidget({
        ...form,
        logo_url: form.logo_url.trim(),
        accent_color: isHexColor(form.accent_color) ? form.accent_color : DEFAULT_WIDGET.accent_color,
        secondary_color: isHexColor(form.secondary_color) ? form.secondary_color : DEFAULT_WIDGET.secondary_color,
        launcher_circle_size: clampNumber(Number(form.launcher_circle_size), 44, 96),
        launcher_pill_size: clampNumber(Number(form.launcher_pill_size), 44, 80),
        border_radius: clampNumber(Number(form.border_radius), 6, 28),
        fallback_message: fallback,
      });
      setWidget(saved);
      setForm((current) => ({ ...current, fallback_message: saved.fallback_message }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save widget");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyScript() {
    if (!widget?.embed_script) return;
    await navigator.clipboard.writeText(widget.embed_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setForm({ ...form, title: t.name, launcher_label: t.name === "Sales Assistant" ? "Talk to Sales" : "Ask AI", bot_role: t.role, bot_goal: t.goal, welcome_message: t.welcome, fallback_message: t.fallback, accent_color: t.color, icon_label: t.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() });
  }

  async function handleLogoFile(file: File) {
    setError(null);
    if (!LOGO_TYPES.includes(file.type)) {
      setError("Upload a PNG, JPG, WebP, SVG, or GIF logo.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("Logo must be 1 MB or smaller.");
      return;
    }

    setIsLogoUploading(true);
    try {
      const response = await uploadWidgetLogo(file);
      setForm((c) => ({ ...c, logo_url: response.logo_url }));
    } catch (err) {
      const message = err instanceof TypeError && err.message === "Failed to fetch"
        ? "Logo upload could not reach the API. Check the backend URL and try again."
        : err instanceof Error ? err.message : "Logo upload failed.";
      setError(message);
    } finally {
      setIsLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  function presetSvg(preset: typeof PRESET_LOGOS[number]) {
    const icon =
      preset.shape === "chat"
        ? '<path d="M30 22h52a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10H51L32 82v-14h-2a10 10 0 0 1-10-10V32a10 10 0 0 1 10-10Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>'
        : preset.shape === "bolt"
          ? '<path d="M58 12 28 58h24l-8 34 32-48H52l6-32Z" fill="currentColor"/>'
          : preset.shape === "shield"
            ? '<path d="M56 12 24 24v24c0 22 14 38 32 44 18-6 32-22 32-44V24L56 12Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><path d="m42 52 10 10 22-24" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
            : preset.shape === "doc"
              ? '<path d="M32 16h34l18 18v54H32V16Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><path d="M66 16v20h18M44 52h28M44 66h28" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>'
              : '<path d="m56 12 8 28 28 8-28 8-8 28-8-28-28-8 28-8 8-28Z" fill="currentColor"/>';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112"><rect width="112" height="112" rx="28" fill="${preset.bg}"/><g color="${preset.fg}">${icon}</g></svg>`;
  }

  function selectPresetLogo(preset: typeof PRESET_LOGOS[number]) {
    setError(null);
    setForm((c) => ({
      ...c,
      logo_url: svgDataUrl(presetSvg(preset)),
      icon_label: preset.initials,
      accent_color: preset.bg,
    }));
  }

  return (
    <section className="glass rounded-xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-dim)", border: "1px solid rgba(99,102,241,0.2)", display: "grid", placeItems: "center" }}>
            <MessageCircle size={15} style={{ color: "var(--accent-light)" }} />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">Chatbot Builder</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Configure appearance, behavior, launch state, and embed code.</p>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <div
            style={{
              width: 36,
              height: 20,
              borderRadius: 999,
              background: form.is_enabled ? "var(--accent)" : "var(--surface-3)",
              border: "1px solid var(--border-default)",
              position: "relative",
              transition: "background 0.15s",
              cursor: "pointer",
            }}
            onClick={() => setForm({ ...form, is_enabled: !form.is_enabled })}
          >
            <div
              style={{
                position: "absolute",
                top: 2,
                left: form.is_enabled ? 18 : 2,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.15s",
              }}
            />
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            {form.is_enabled ? "Live" : "Paused"}
          </span>
        </label>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {/* Templates */}
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.06]">
                <Sparkles size={14} style={{ color: "var(--accent-light)" }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Quick-start Templates</p>
                <p className="text-xs text-slate-500">Pick a role and tune details below.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => applyTemplate(t)}
                className="flex min-h-16 items-center gap-2 rounded-lg border px-3 py-3 text-left text-xs font-semibold transition hover:bg-white/[0.07]"
                style={{ borderColor: `${t.color}30`, background: `${t.color}10`, color: t.color }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <Section icon={Palette} title="Appearance" description="Brand, launcher, placement, and first impression.">
          {/* Logo */}
          <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleLogoFile(file);
              }}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="group relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 text-sm font-bold text-white"
                style={{ background: form.accent_color || "var(--accent)" }}
                onClick={() => logoInputRef.current?.click()}
                aria-label="Upload widget logo"
              >
                <LogoMark form={form} />
                <span className="absolute inset-0 hidden place-items-center bg-black/55 text-white group-hover:grid">
                  {isLogoUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isLogoUploading}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-slate-950 transition hover:bg-violet-100 disabled:opacity-60"
                  >
                    {isLogoUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                    {isLogoUploading ? "Uploading" : "Upload logo"}
                  </button>
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logo_url: "" })}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                    >
                      <X size={13} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Stored in Supabase Storage. PNG, JPG, WebP, SVG, or GIF up to 1 MB.</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_140px]">
              <input className="inp" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} onBlur={(e) => setForm({ ...form, logo_url: e.target.value.trim() })} placeholder="Logo URL" />
              <input className="inp" value={form.icon_label} onChange={(e) => setForm({ ...form, icon_label: e.target.value.slice(0, 3).toUpperCase() })} placeholder="Icon letters" />
            </div>
            <div className="mt-3">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Built-in logos</p>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_LOGOS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => selectPresetLogo(preset)}
                    disabled={isLogoUploading}
                    className="grid h-12 place-items-center rounded-lg border border-white/10 text-xs font-bold transition hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ background: preset.bg, color: preset.fg }}
                    aria-label={`Use ${preset.label} logo`}
                    title={preset.label}
                  >
                    {preset.initials}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="inp" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Company name" />
            <input className="inp" value={form.company_email} onChange={(e) => setForm({ ...form, company_email: e.target.value })} type="email" placeholder="Company support email" />
          </div>
          <input className="inp" value={form.company_site} onChange={(e) => setForm({ ...form, company_site: e.target.value })} placeholder="Company website (optional)" />
          <input className="inp" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Widget title" />
          <input className="inp" value={form.launcher_label} onChange={(e) => setForm({ ...form, launcher_label: e.target.value })} placeholder="Launcher button label" />
          <input className="inp" value={form.input_placeholder} onChange={(e) => setForm({ ...form, input_placeholder: e.target.value })} placeholder="Input placeholder text" />
          <textarea className="inp" value={form.welcome_message} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} rows={2} placeholder="Welcome message" style={{ resize: "none" }} />
          <div className="grid gap-2 md:grid-cols-2">
            <select className="inp" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as "dark" | "light" })}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
            <select className="inp" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value as "bottom-right" | "bottom-left" })}>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <ColorControl label="Accent" value={form.accent_color} onChange={(accent_color) => setForm({ ...form, accent_color })} />
            <ColorControl label="Header" value={form.secondary_color} onChange={(secondary_color) => setForm({ ...form, secondary_color })} />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <select className="inp" value={form.launcher_style} onChange={(e) => setForm({ ...form, launcher_style: e.target.value as "pill" | "circle" })}>
              <option value="pill">Pill Launcher</option>
              <option value="circle">Circle Launcher</option>
            </select>
            <input className="inp" type="number" min={6} max={28} value={form.border_radius} onChange={(e) => setForm({ ...form, border_radius: Number(e.target.value) })} placeholder="Border radius" />
          </div>
          <div className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/35 p-3 md:grid-cols-2">
            <label className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Circle size</span>
                <span className="font-mono text-slate-500">{form.launcher_circle_size}px</span>
              </div>
              <input
                type="range"
                min={44}
                max={96}
                value={form.launcher_circle_size}
                onChange={(e) => setForm({ ...form, launcher_circle_size: Number(e.target.value) })}
                className="w-full accent-indigo-400"
              />
            </label>
            <label className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Pill height</span>
                <span className="font-mono text-slate-500">{form.launcher_pill_size}px</span>
              </div>
              <input
                type="range"
                min={44}
                max={80}
                value={form.launcher_pill_size}
                onChange={(e) => setForm({ ...form, launcher_pill_size: Number(e.target.value) })}
                className="w-full accent-indigo-400"
              />
            </label>
          </div>
        </Section>

        {/* Behavior */}
        <Section icon={Bot} title="Behavior" description="Control how the assistant answers and escalates.">
          <select className="inp" value={form.bot_role} onChange={(e) => setForm({ ...form, bot_role: e.target.value })}>
            <option value="customer_support">Customer Care</option>
            <option value="hr_policy_assistant">HR Policy Assistant</option>
            <option value="sales_assistant">Sales Assistant</option>
            <option value="internal_knowledge_base">Internal Knowledge Base</option>
            <option value="technical_support">Technical Support</option>
          </select>
          <select className="inp" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="concise">Concise</option>
            <option value="empathetic">Empathetic</option>
          </select>
          <textarea className="inp" value={form.bot_goal} onChange={(e) => setForm({ ...form, bot_goal: e.target.value })} rows={3} placeholder="Business goal — what should this bot accomplish?" style={{ resize: "none" }} />
          <textarea className="inp" value={form.fallback_message} onChange={(e) => setForm({ ...form, fallback_message: e.target.value })} rows={2} placeholder="Message when no answer is found" style={{ resize: "none" }} />
        </Section>

        {/* Advanced */}
        <Section icon={SlidersHorizontal} title="Advanced" description="Extra guardrails and deployment settings.">
          <textarea className="inp" value={form.custom_instructions} onChange={(e) => setForm({ ...form, custom_instructions: e.target.value })} rows={6} placeholder="Custom system instructions. Example: Ask for contact details before answering pricing questions." style={{ resize: "none" }} />
          <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", padding: "0.625rem 0.75rem", borderRadius: 8, background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
            <input type="checkbox" checked={form.collect_leads} onChange={(e) => setForm({ ...form, collect_leads: e.target.checked })} style={{ accentColor: "var(--accent)" }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Collect lead / contact details when useful</span>
          </label>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-accent"
            style={{ height: "2.625rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : null}
            {isSaving ? "Saving…" : "Save Chatbot"}
          </button>
          {error && <p style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{error}</p>}
        </Section>

        {/* Embed code */}
        {widget?.embed_script && (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>Embed Code</p>
              <button
                type="button"
                onClick={copyScript}
                className="btn-ghost"
                style={{ height: "1.875rem", padding: "0 0.75rem", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem" }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre
              style={{
                overflowX: "auto",
                padding: "0.875rem",
                borderRadius: 8,
                background: "var(--surface-0)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.6875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <code>{widget.embed_script}</code>
            </pre>
          </div>
        )}
      </div>
      <WidgetPreview form={form} />
      </div>
    </section>
  );
}
