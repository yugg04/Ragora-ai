"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Loader2, UploadCloud, CheckCircle2 } from "lucide-react";

type Props = {
  userId: string;
  onUploaded: () => Promise<void> | void;
};

export function FileUpload({ userId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setSuccess(false);
    try {
      const { uploadPdf } = await import("@/lib/api");
      await uploadPdf(userId, file);
      await onUploaded();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    await handleFile(event.target.files?.[0]);
    event.target.value = "";
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Documents
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="btn-ghost"
          style={{ height: "1.75rem", padding: "0 0.625rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
        >
          {isUploading ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
          Upload
        </button>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          width: "100%",
          minHeight: "5rem",
          borderRadius: 8,
          border: `1.5px dashed ${isDragging ? "var(--accent)" : "var(--border-default)"}`,
          background: isDragging ? "var(--accent-dim)" : "var(--surface-0)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.375rem",
          cursor: isUploading ? "not-allowed" : "pointer",
          transition: "border-color 0.15s, background 0.15s",
          padding: "1rem",
        }}
      >
        {isUploading ? (
          <>
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent-light)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Processing…</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>Uploaded successfully</span>
          </>
        ) : (
          <>
            <UploadCloud size={18} style={{ color: "var(--text-tertiary)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
              Drop PDF or <span style={{ color: "var(--accent-light)" }}>browse</span>
            </span>
          </>
        )}
      </button>

      <input ref={inputRef} type="file" accept="application/pdf" onChange={handleChange} style={{ display: "none" }} />
      {error && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--danger)" }}>{error}</p>
      )}
    </div>
  );
}