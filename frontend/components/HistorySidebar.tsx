"use client";

import { MessageSquare, Clock } from "lucide-react";
import type { ChatMessage } from "@/lib/api";

type Props = {
  messages: ChatMessage[];
};

export function HistorySidebar({ messages }: Props) {
  const userMessages = messages.filter((m) => m.role === "user").slice().reverse();

  return (
    <aside
      style={{
        width: 256,
        flexShrink: 0,
        borderRight: "1px solid var(--border-subtle)",
        background: "var(--surface-0)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
      className="hidden lg:flex"
    >
      <div style={{ padding: "1.25rem 1rem 0.75rem" }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Chat History
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 0.75rem 1rem" }}>
        {userMessages.length === 0 ? (
          <div style={{ padding: "1rem 0.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", textAlign: "center" }}>
            <Clock size={20} style={{ color: "var(--text-tertiary)" }} />
            <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>Your questions will appear here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {userMessages.map((message, index) => (
              <div
                key={message.id ?? `${message.timestamp}-${index}`}
                className="card-sm"
                style={{ padding: "0.625rem 0.75rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
                  <MessageSquare size={11} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.625rem", color: "var(--text-tertiary)" }}>
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.5,
                  }}
                >
                  {message.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}