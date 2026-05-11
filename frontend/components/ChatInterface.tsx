"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, SendHorizonal, Bot, User, Sparkles } from "lucide-react";
import type { ChatMessage, DocumentItem } from "@/lib/api";
import { streamChat } from "@/lib/api";

type Props = {
  userId: string;
  messages: ChatMessage[];
  documents: DocumentItem[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onRefreshHistory: () => Promise<void>;
};

export function ChatInterface({ userId, messages, documents, onMessagesChange, onRefreshHistory }: Props) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    const userMessage: ChatMessage = {
      user_id: userId,
      message: question,
      role: "user",
      timestamp: new Date().toISOString(),
    };
    const botMessage: ChatMessage = {
      user_id: userId,
      message: "",
      role: "bot",
      timestamp: new Date().toISOString(),
    };

    onMessagesChange([...messages, userMessage, botMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    let streamed = "";
    try {
      await streamChat(userId, question, (token) => {
        streamed += token;
        onMessagesChange([...messages, userMessage, { ...botMessage, message: streamed }]);
      });
      await onRefreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat request failed");
      onMessagesChange([...messages, userMessage, { ...botMessage, message: "I couldn't complete that request." }]);
    } finally {
      setIsLoading(false);
    }
  }

  const suggestions = [
    "Summarize the uploaded knowledge base",
    "What questions can this assistant answer?",
    "List the uploaded documents",
  ];
  const readyDocuments = documents.filter((document) => (document.status ?? "ready") === "ready");
  const processingDocuments = documents.filter((document) => document.status === "processing");

  return (
    <section className="relative" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.12),transparent_30rem)]" />
      {/* Header */}
      <div
        className="relative z-10 border-b border-white/10 bg-slate-950/45 px-5 py-4 backdrop-blur-xl"
        style={{ flexShrink: 0 }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "#fff",
              color: "#080b14",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Bot size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Ragora Playground</p>
            <p className="text-xs text-slate-500">Answers scoped to {userId}&apos;s uploaded documents</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {processingDocuments.length > 0 && (
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
              {processingDocuments.length} processing
            </span>
          )}
          <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-100">
            {readyDocuments.length} active {readyDocuments.length === 1 ? "file" : "files"}
          </span>
        </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10" style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 text-center sm:p-8"
            >
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-950 shadow-[0_0_50px_rgba(196,181,253,0.25)]">
                <Sparkles size={20} />
              </div>
              <p className="text-lg font-semibold text-white">Test your knowledge assistant</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                {readyDocuments.length > 0
                  ? "Your uploaded files are attached to this workspace. Ask realistic buyer, support, or internal questions and verify grounded answers."
                  : "Upload a PDF from the sidebar and Ragora will automatically attach it to this workspace."}
              </p>
              {readyDocuments.length > 0 && (
                <div className="mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2">
                  {readyDocuments.slice(0, 5).map((document) => (
                    <span key={document.id} className="rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-medium text-teal-100">
                      {document.file_name}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3 text-left text-xs leading-5 text-slate-300 transition hover:border-white/20 hover:bg-white/[0.075]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id ?? `${message.role}-${index}`}
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                  gap: "0.625rem",
                  alignItems: "flex-start",
                }}
              >
                {message.role === "bot" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "var(--surface-3)",
                      border: "1px solid var(--border-default)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Bot size={13} style={{ color: "var(--accent-light)" }} />
                  </div>
                )}
                <div
                  className={message.role === "bot" ? "shadow-[0_20px_70px_rgba(0,0,0,0.20)]" : ""}
                  style={{
                    maxWidth: "78%",
                    padding: "0.75rem 1rem",
                    borderRadius: message.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                    fontSize: "0.875rem",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    ...(message.role === "user"
                      ? {
                          background: "var(--accent)",
                          color: "#fff",
                          boxShadow: "0 4px 14px var(--accent-glow)",
                        }
                      : {
                          background: "var(--surface-2)",
                          border: "1px solid var(--border-default)",
                          color: "var(--text-primary)",
                        }),
                  }}
                >
                  {message.message || (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-tertiary)" }}>
                      <Loader2 size={13} className="animate-spin" />
                      Thinking…
                    </span>
                  )}
                </div>
                {message.role === "user" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "var(--surface-3)",
                      border: "1px solid var(--border-default)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <User size={13} style={{ color: "var(--text-secondary)" }} />
                  </div>
                )}
              </motion.div>
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input */}
      <div
        className="relative z-10 border-t border-white/10 bg-slate-950/55 px-5 py-4 backdrop-blur-xl"
        style={{ flexShrink: 0 }}
      >
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/10 bg-white/[0.045] p-2 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
          style={{ maxWidth: 820, margin: "0 auto", display: "flex", gap: "0.625rem", alignItems: "flex-end" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            placeholder="Ask a question from your documents…"
            className="inp"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              resize: "none",
              minHeight: "2.625rem",
              maxHeight: "9rem",
              paddingTop: "0.625rem",
              paddingBottom: "0.625rem",
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-accent"
            aria-label="Send"
            style={{ width: "2.625rem", height: "2.625rem", flexShrink: 0, display: "grid", placeItems: "center", padding: 0 }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
          </button>
        </form>
        {error && (
          <p style={{ maxWidth: 720, margin: "0.5rem auto 0", fontSize: "0.75rem", color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
