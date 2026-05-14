"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  ChevronDown,
  DatabaseZap,
  FileSearch,
  Globe2,
  Linkedin,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";

const companies = ["Northstar", "Vanta Labs", "Pulse", "Evervault", "Layer", "Kairo"];

const developer = {
  name: "Henil Bhavsar",
  linkedin: "https://www.linkedin.com/in/henil-bhavsar-18b45b311/",
  email: "henilbhavsar164@gmail.com",
};

const features = [
  {
    icon: FileSearch,
    title: "Grounded AI retrieval",
    text: "Upload policies, PDFs, and playbooks. Ragora answers with source-aware context instead of hallucinated guesswork.",
  },
  {
    icon: Bot,
    title: "Embeddable AI agents",
    text: "Launch a polished website assistant with branded colors, welcome flows, and customer-safe responses.",
  },
  {
    icon: BarChart3,
    title: "Revenue-grade analytics",
    text: "Track questions, conversion signals, unanswered topics, latency, and adoption across every workspace.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    text: "JWT sessions, refresh rotation, OTP verification, scoped API keys, and audit-friendly workspace boundaries.",
  },
  {
    icon: DatabaseZap,
    title: "Automation-ready memory",
    text: "Turn static knowledge into workflows for onboarding, support, sales enablement, and internal operations.",
  },
  {
    icon: Zap,
    title: "Fast in production",
    text: "Streaming responses, vector search, smart chunking, and a front end tuned for responsive customer moments.",
  },
];

const testimonials = [
  {
    quote:
      "Ragora made our help center feel alive in one afternoon. The quality bar feels like a product we would happily pay for.",
    name: "Henil Bhavsar",
    role: "Founder",
    linkedin: "https://www.linkedin.com/in/henil-bhavsar-18b45b311/",
  },
  {
    quote:
      "The widget captured buying questions our sales team was missing. It paid for itself before we finished onboarding.",
    name: "Yug Khatri",
    role: "CEO",
    linkedin: "https://www.linkedin.com/in/yug04/",
  },
  {
    quote:
      "It feels elegant enough for customers and practical enough for operations. That combination is rare.",
    name: "Savan Patel",
    role: "COO",
    linkedin: "https://www.linkedin.com/in/savan-patel-777aa3323/",
  },
];

const faqs = [
  ["What does Ragora do?", "Ragora turns documents, product pages, and operating knowledge into trusted AI assistants for customers and teams."],
  ["Is authentication production-ready?", "The frontend includes the full UI for JWT login, OAuth entry points, OTP verification, password reset, loading states, validation, and secure session patterns."],
  ["Can I embed it on my website?", "Yes. Ragora includes a customizable widget builder for adding a branded AI assistant to any website."],
  ["Which teams is this for?", "Support, sales, customer success, operations, and founder-led teams that need fast, accurate answers from private knowledge."],
];

function LogoMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-950 shadow-[0_0_40px_rgba(196,181,253,0.35)]">
        <Sparkles size={17} />
      </span>
      <span className="text-base font-semibold tracking-tight text-white">Ragora</span>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="glass relative mx-auto w-full max-w-5xl overflow-hidden rounded-xl p-2">
      <div className="rounded-lg border border-white/10 bg-slate-950/88">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-teal-300" />
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-400">ragora.app/workspace</div>
        </div>
        <div className="grid gap-0 lg:grid-cols-[220px_1fr_280px]">
          <aside className="hidden border-r border-white/10 p-4 lg:block">
            <LogoMark />
            <div className="mt-8 space-y-2">
              {["Overview", "Sources", "Widget", "Analytics"].map((item, index) => (
                <div key={item} className={`rounded-lg px-3 py-2 text-sm ${index === 0 ? "bg-violet-400/15 text-violet-100" : "text-slate-500"}`}>
                  {item}
                </div>
              ))}
            </div>
          </aside>
          <section className="p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-slate-500">Command center</p>
                <h3 className="text-xl font-semibold text-white">AI answer operations</h3>
              </div>
              <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs text-teal-100">Live</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["92% resolved", "1.8s latency", "18 sources"].map((metric) => (
                <div key={metric} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-2xl font-semibold text-white">{metric.split(" ")[0]}</p>
                  <p className="mt-1 text-xs text-slate-500">{metric.split(" ").slice(1).join(" ")}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
                <MessageSquareText size={16} className="text-violet-200" />
                Customer asks: “Can Ragora answer from our implementation docs?”
              </div>
              <div className="rounded-lg bg-white/[0.055] p-4 text-sm leading-6 text-slate-300">
                Yes. Ragora indexes private documentation, retrieves the most relevant chunks, and streams a grounded response through your branded assistant.
              </div>
            </div>
          </section>
          <aside className="border-t border-white/10 p-4 lg:border-l lg:border-t-0">
            <p className="mb-4 text-sm font-semibold text-white">Workflow preview</p>
            {["Upload source", "Generate embeddings", "Deploy widget", "Monitor gaps"].map((step, index) => (
              <div key={step} className="mb-3 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-300 text-xs font-bold text-slate-950">{index + 1}</span>
                {step}
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="premium-shell overflow-hidden">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Ragora home"><LogoMark /></Link>
          <div className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:block">Log in</Link>
            <Link href="/signup" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-100">Start free</Link>
          </div>
        </div>
      </nav>

      <section className="relative px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div aria-hidden className="mesh-line absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-7xl text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-sm text-slate-300">
            <Sparkles size={15} className="text-violet-200" />
            AI knowledge assistants for modern teams
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mx-auto mb-5 flex w-fit flex-wrap items-center justify-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
            <span className="text-teal-100/70">Developed by</span>
            <a href={developer.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
              <Linkedin size={13} />
              {developer.name}
            </a>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mx-auto max-w-5xl text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-7xl lg:text-8xl">
            Launch a trusted AI knowledge layer with <span className="text-gradient">Ragora</span>.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Ragora turns documents, product knowledge, and customer workflows into secure AI assistants with analytics, embedded chat, and a polished auth experience.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="flex h-12 items-center gap-2 rounded-lg bg-white px-6 font-semibold text-slate-950 shadow-[0_20px_60px_rgba(255,255,255,0.12)] transition hover:bg-violet-100">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <a href="#showcase" className="flex h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-6 font-semibold text-white transition hover:bg-white/[0.085]">
              <Play size={17} /> Watch Demo
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="relative mt-14">
            <div className="absolute -left-2 top-10 hidden rounded-lg border border-white/10 bg-slate-950/80 p-3 text-left shadow-2xl lg:block">
              <p className="text-xs text-slate-500">Security</p>
              <p className="text-sm font-semibold text-white">JWT + OTP verified</p>
            </div>
            <div className="absolute -right-2 top-28 hidden rounded-lg border border-teal-300/20 bg-teal-300/10 p-3 text-left shadow-2xl lg:block">
              <p className="text-xs text-teal-100/70">AI widget</p>
              <p className="text-sm font-semibold text-teal-50">92% answer rate</p>
            </div>
            <DashboardMockup />
          </motion.div>
        </div>
      </section>



      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase text-violet-200">Features</p>
          <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Everything a sellable AI SaaS needs on day one.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article key={feature.title} whileHover={{ y: -6 }} className="glass rounded-xl p-6">
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-white text-slate-950"><Icon size={20} /></div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.text}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="showcase" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-8">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-teal-200">Product showcase</p>
              <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-white">Dashboard, chat, analytics, and AI workflow previews in one coherent surface.</h2>
            </div>
            <Link href="/dashboard" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 font-semibold text-white hover:bg-white/5">
              Preview dashboard <ArrowRight size={16} />
            </Link>
          </div>
          <DashboardMockup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-xl border border-white/10 bg-white/[0.035] p-6">
              <p className="text-base leading-7 text-slate-200">“{item.quote}”</p>
              <a
                href={item.linkedin}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 font-semibold text-white hover:text-violet-200 transition"
              >
                <Linkedin size={16} />
                {item.name}
              </a>
              <p className="text-sm text-slate-500">{item.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <h2 className="mb-8 text-center text-4xl font-semibold tracking-tight text-white">Questions, answered.</h2>
        <div className="space-y-3">
          {faqs.map(([question, answer], index) => (
            <button key={question} onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="w-full rounded-xl border border-white/10 bg-white/[0.035] p-5 text-left">
              <span className="flex items-center justify-between gap-4 text-base font-semibold text-white">
                {question}
                <ChevronDown className={`h-4 w-4 transition ${openFaq === index ? "rotate-180" : ""}`} />
              </span>
              {openFaq === index && <span className="mt-3 block text-sm leading-6 text-slate-400">{answer}</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_15%_20%,rgba(94,234,212,0.2),transparent_28rem),linear-gradient(135deg,rgba(139,92,246,0.22),rgba(255,255,255,0.04))] p-8 text-center sm:p-14">
          <Globe2 className="mx-auto mb-5 h-10 w-10 text-teal-200" />
          <h2 className="text-4xl font-semibold tracking-tight text-white">Start building smarter today.</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Give customers and teams instant answers from the knowledge you already have.</p>
          <Link href="/signup" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 font-semibold text-slate-950 hover:bg-violet-100">
            Start Free Trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <footer className="border-t border-white/10 bg-black/20 px-4 py-14 backdrop-blur-xl sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_2fr]">

          {/* Left Side */}
          <div>
            <LogoMark />

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Ragora is the AI knowledge operating system for modern companies —
              built for customer support, internal operations, onboarding, and
              intelligent workflow automation.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={developer.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-white"
              >
                <Linkedin size={16} />
                LinkedIn
              </a>

              <a
                href={`mailto:${developer.email}`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                <Mail size={16} />
                Contact
              </a>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Built by
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/20 text-white">
                  <Sparkles size={18} />
                </div>

                <div>
                  <p className="font-semibold text-white">{developer.name}</p>
                  <p className="text-sm text-slate-500">
                    AI Engineer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">

            {/* Product */}
            <div>
              <p className="mb-4 text-sm font-semibold text-white">
                Product
              </p>

              <div className="space-y-3 text-sm text-slate-500">
                <Link href="/dashboard" className="block transition hover:text-white">
                  Dashboard
                </Link>

                <a href="#features" className="block transition hover:text-white">
                  Features
                </a>

                <a href="#showcase" className="block transition hover:text-white">
                  Showcase
                </a>

                <Link href="/signup" className="block transition hover:text-white">
                  Start Free
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <p className="mb-4 text-sm font-semibold text-white">
                Resources
              </p>

              <div className="space-y-3 text-sm text-slate-500">
                <a
                  href="https://github.com/Henilll"
                  target="_blank"
                  rel="noreferrer"
                  className="block transition hover:text-white"
                >
                  GitHub
                </a>

                <a
                  href={developer.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="block transition hover:text-white"
                >
                  LinkedIn
                </a>

                <a
                  href={`mailto:${developer.email}`}
                  className="block transition hover:text-white"
                >
                  Contact
                </a>
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="mb-4 text-sm font-semibold text-white">
                Company
              </p>

              <div className="space-y-3 text-sm text-slate-500">
                <a href="#faq" className="block transition hover:text-white">
                  FAQ
                </a>

                <a href="#features" className="block transition hover:text-white">
                  Solutions
                </a>

                <a href="#showcase" className="block transition hover:text-white">
                  Demo
                </a>
              </div>
            </div>

            {/* Developers */}
            <div>
              <p className="mb-4 text-sm font-semibold text-white">
                Team
              </p>

              <div className="space-y-4">

                <a
                  href="https://www.linkedin.com/in/henil-bhavsar-18b45b311/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                >
                  <Linkedin size={15} />
                  Henil Bhavsar
                </a>

                <a
                  href="https://www.linkedin.com/in/yug04/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                >
                  <Linkedin size={15} />
                  Yug Khatri
                </a>

                <a
                  href="https://www.linkedin.com/in/savan-patel-777aa3323/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                >
                  <Linkedin size={15} />
                  Savan Patel
                </a>

              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row">

          <p>
            © 2026 Ragora. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <a
              href={developer.linkedin}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              <Linkedin size={16} />
            </a>

            <a
              href={`mailto:${developer.email}`}
              className="transition hover:text-white"
            >
              <Mail size={16} />
            </a>

            <Globe2 size={16} />
          </div>
        </div>
      </footer>
    </main>
  );
}
