"use client";

import { FileText, Trash2 } from "lucide-react";
import type { DocumentItem } from "@/lib/api";

type Props = {
  documents: DocumentItem[];
  onDelete: (documentId: string) => Promise<void>;
};

export function DocumentList({ documents, onDelete }: Props) {
  const readyCount = documents.filter((document) => (document.status ?? "ready") === "ready").length;

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Uploaded PDFs
        </p>
        {documents.length > 0 && (
          <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-2 py-0.5 text-[11px] font-semibold text-teal-100">
            {readyCount}/{documents.length} ready
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {documents.length === 0 ? (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", padding: "0.5rem 0" }}>No documents yet.</p>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="card-sm"
              style={{ padding: "0.625rem 0.75rem", display: "flex", alignItems: "center", gap: "0.625rem" }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={13} style={{ color: "var(--accent-light)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}
                  title={document.file_name}
                >
                  {document.file_name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      document.status === "failed"
                        ? "bg-rose-400"
                        : document.status === "processing"
                          ? "bg-amber-300"
                          : "bg-teal-300"
                    }`}
                  />
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>
                    {document.status === "processing" ? "Processing" : document.status === "failed" ? "Failed" : `${document.chunk_count} chunks`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(document.id)}
                aria-label={`Delete ${document.file_name}`}
                style={{
                  width: 28,
                  height: 28,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.12)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
