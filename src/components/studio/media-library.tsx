"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Media } from "@/lib/content";
export function MediaLibrary({ media }: { media: Media[] }) {
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <form
        className="studio-panel stack"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const body = new FormData(form);
          start(async () => {
            try {
              const res = await fetch("/api/media", { method: "POST", body });
              const result = await res.json();
              setMessage(result.message);
              if (res.ok) {
                form.reset();
                router.refresh();
              }
            } catch {
              setMessage("Upload failed. Check your connection and retry.");
            }
          });
        }}
      >
        <h2>Upload an asset</h2>
        <p className="muted">
          JPG, PNG, WebP, or non-active PDF. Maximum 10 MB. Images are
          re-encoded and stripped of metadata. Assets stay private until used in
          published content.
        </p>
        <div className="form-grid">
          <label>
            File
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
            />
          </label>
          <label>
            Descriptive alt text
            <input name="alt" maxLength={300} required />
          </label>
        </div>
        <button className="button button-light" disabled={pending}>
          {pending ? "Working…" : "Upload asset ↑"}
        </button>
        <p role="status">{message}</p>
      </form>
      <div className="media-grid">
        {media.map((m) => (
          <article key={m.id} className="studio-panel">
            {m.mime.startsWith("image/") ? (
              <Image
                src={`/media/${m.id}`}
                width={400}
                height={260}
                alt={m.alt}
                unoptimized
                className="media-thumbnail"
              />
            ) : (
              <a href={`/media/${m.id}`} className="pdf-preview">
                PDF ↗
              </a>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const alt = String(new FormData(e.currentTarget).get("alt"));
                start(async () => {
                  const res = await fetch(`/api/media/${m.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ alt }),
                  });
                  setMessage((await res.json()).message);
                  router.refresh();
                });
              }}
            >
              <label>
                Alt text
                <input
                  name="alt"
                  defaultValue={m.alt}
                  required
                  maxLength={300}
                />
              </label>
              <div className="editor-toolbar">
                <button disabled={pending}>Save alt</button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await fetch(`/api/media/${m.id}`, {
                        method: "DELETE",
                      });
                      setMessage((await res.json()).message);
                      router.refresh();
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </form>
            <p className="mono small muted">
              {Math.round(m.size / 1024)} KB ·{" "}
              {m.width ? `${m.width} × ${m.height}` : "document"}
            </p>
            <code className="small">{m.id}</code>
          </article>
        ))}
      </div>
    </>
  );
}
