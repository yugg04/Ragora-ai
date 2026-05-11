"use client";

import { AlertTriangle, BarChart3, Clock, MessageSquare, Users, Zap } from "lucide-react";
import type { WidgetAnalytics } from "@/lib/api";

type Props = {
  analytics: WidgetAnalytics | null;
};

const METRIC_CONFIG = [
  { key: "total_messages", label: "Total Messages", icon: MessageSquare, color: "var(--accent-light)" },
  { key: "unique_visitors", label: "Unique Visitors", icon: Users, color: "#34d399" },
  { key: "user_messages", label: "User Questions", icon: BarChart3, color: "#fb923c" },
  { key: "unanswered_count", label: "No-Answer Replies", icon: AlertTriangle, color: "#fbbf24" },
  { key: "total_tokens", label: "Est. Tokens", icon: Zap, color: "#e879f9" },
  { key: "average_latency_ms", label: "Avg Latency", icon: Clock, color: "#38bdf8" },
];

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  index,
}: {
  label: string;
  value: string | number;
  icon: typeof MessageSquare;
  color: string;
  index: number;
}) {
  return (
    <div
      className="card metric-card fade-up"
      style={{
        padding: "1.25rem",
        animationDelay: `${index * 0.05}s`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle top accent line */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: "1rem",
          right: "1rem",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
        }}
      />
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: `${color}15`,
          border: `1px solid ${color}25`,
          display: "grid",
          placeItems: "center",
          marginBottom: "0.875rem",
        }}
      >
        <Icon size={15} color={color} />
      </div>
      <p
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginBottom: "0.25rem",
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </p>
    </div>
  );
}

export function AnalyticsPanel({ analytics }: Props) {
  if (!analytics) {
    return (
      <div className="card fade-up" style={{ padding: "2rem", textAlign: "center" }}>
        <BarChart3 size={28} style={{ color: "var(--text-tertiary)", margin: "0 auto 0.75rem" }} />
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>No data yet</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
          Analytics appear after visitors interact with your embedded chatbot.
        </p>
      </div>
    );
  }

  const maxDaily = Math.max(...analytics.daily_messages.map((item) => item.count), 1);

  const metricValues: Record<string, string | number> = {
    total_messages: analytics.total_messages,
    unique_visitors: analytics.unique_visitors,
    user_messages: analytics.user_messages,
    unanswered_count: analytics.unanswered_count,
    total_tokens: analytics.total_tokens.toLocaleString(),
    average_latency_ms: `${analytics.average_latency_ms}ms`,
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Metric grid */}
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {METRIC_CONFIG.map((m, i) => (
          <MetricCard
            key={m.key}
            label={m.label}
            value={metricValues[m.key]}
            icon={m.icon}
            color={m.color}
            index={i}
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Bar chart */}
        <div className="card fade-up fade-up-d2" style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>Daily Questions</p>
            <span className="badge">{analytics.daily_messages.length} days</span>
          </div>
          <div style={{ display: "flex", height: 140, alignItems: "flex-end", gap: 6 }}>
            {analytics.daily_messages.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>No traffic yet.</p>
            ) : (
              analytics.daily_messages.map((item) => {
                const pct = Math.max(4, (item.count / maxDaily) * 100);
                return (
                  <div key={item.date} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${pct}%`,
                        borderRadius: "4px 4px 0 0",
                        background: `linear-gradient(180deg, var(--accent-light), var(--accent))`,
                        opacity: 0.85,
                        transition: "opacity 0.15s",
                      }}
                      title={`${item.date}: ${item.count}`}
                    />
                    <span style={{ fontSize: "0.625rem", color: "var(--text-tertiary)", textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Most asked */}
        <div className="card fade-up fade-up-d3" style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.125rem" }}>
            Most Asked
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {analytics.top_questions.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>No questions yet.</p>
            ) : (
              analytics.top_questions.map((item, i) => (
                <div key={item.question} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "var(--text-tertiary)",
                      paddingTop: 2,
                      minWidth: 14,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p style={{ flex: 1, fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.question}
                  </p>
                  <span className="badge" style={{ flexShrink: 0 }}>{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Unanswered questions */}
      <div className="card fade-up fade-up-d4" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Unanswered Questions
          </p>
          {analytics.unanswered_questions.length > 0 && (
            <span className="badge" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", borderColor: "rgba(251,191,36,0.2)" }}>
              {analytics.unanswered_questions.length} flagged
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {analytics.unanswered_questions.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>All questions answered — great coverage.</p>
          ) : (
            analytics.unanswered_questions.map((item) => (
              <div
                key={`${item.timestamp}-${item.question}`}
                className="card-sm"
                style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}
              >
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{item.question}</p>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", flexShrink: 0, paddingTop: 2 }}>
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
