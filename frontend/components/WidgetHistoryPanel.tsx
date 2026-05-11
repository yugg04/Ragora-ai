"use client";

import { Users, MessageCircle, Circle } from "lucide-react";
import type { WidgetHistory } from "@/lib/api";

type Props = {
  history: WidgetHistory | null;
};

export function WidgetHistoryPanel({ history }: Props) {
  const conversations = history?.conversations ?? [];

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>Live Widget Conversations</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.125rem" }}>
            Recent visitor sessions from embedded chatbots
          </p>
        </div>
        {conversations.length > 0 && (
          <span className="badge-success badge">
            <Circle size={6} style={{ marginRight: 4, fill: "#34d399" }} />
            {conversations.length} active
          </span>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <Users size={26} style={{ color: "var(--text-tertiary)", margin: "0 auto 0.75rem" }} />
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>No widget conversations yet</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
            Embed your chatbot and conversations will appear here in real time.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {conversations.slice(0, 8).map((conversation) => (
            <article key={conversation.visitor_id} className="card" style={{ padding: "1.25rem" }}>
              {/* Visitor header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--surface-3)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MessageCircle size={14} style={{ color: "var(--accent-light)" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {conversation.visitor_id}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>
                      {conversation.message_count} messages · {new Date(conversation.last_seen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <Circle size={8} style={{ color: "#34d399", fill: "#34d399", flexShrink: 0 }} className="pulse" />
              </div>

              {/* Message thread */}
              <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {conversation.messages.map((message, index) => (
                  <div
                    key={`${message.timestamp}-${index}`}
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: message.role === "user" ? "8px 8px 3px 8px" : "8px 8px 8px 3px",
                      fontSize: "0.8125rem",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      ...(message.role === "user"
                        ? {
                            background: "var(--accent)",
                            color: "#fff",
                            alignSelf: "flex-end",
                            maxWidth: "85%",
                          }
                        : message.had_answer === false
                        ? {
                            background: "rgba(251,191,36,0.08)",
                            border: "1px solid rgba(251,191,36,0.2)",
                            color: "#fde68a",
                            alignSelf: "flex-start",
                            maxWidth: "85%",
                          }
                        : {
                            background: "var(--surface-2)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-primary)",
                            alignSelf: "flex-start",
                            maxWidth: "85%",
                          }),
                    }}
                  >
                    <p>{message.message}</p>
                    <p
                      style={{
                        fontSize: "0.625rem",
                        marginTop: "0.25rem",
                        color: message.role === "user" ? "rgba(255,255,255,0.55)" : "var(--text-tertiary)",
                      }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}