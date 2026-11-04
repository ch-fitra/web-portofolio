"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  login,
  saveDocument,
  saveProject,
  saveRecord,
  deleteRecord,
  restoreRevision,
  type ActionResult,
} from "@/app/actions";
import type {
  Profile,
  Settings,
  ProjectInput,
  ContentRecord,
  Block,
} from "@/lib/schema";
import type { Media } from "@/lib/content";
export function LoginForm() {
  const [state, action, pending] = useActionState(login, {
    ok: false,
    message: "",
  });
  return (
    <form action={action} className="stack">
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
        />
      </label>
      <button className="button button-light" disabled={pending}>
        {pending ? "Signing in…" : "Enter studio ↗"}
      </button>
      {state.message && (
        <p role="status" className="form-status failure">
          {state.message}
        </p>
      )}
      <p className="small muted">Private access to Owner Studio.</p>
    </form>
  );
}
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  ...props
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <label>
      {label}
      {multiline ? (
        <textarea
          aria-label={label}
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      ) : (
        <input
          aria-label={label}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      )}
    </label>
  );
}
export function MediaSelect({
  label,
  value,
  onChange,
  media,
  pdf = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  media: Media[];
  pdf?: boolean;
}) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">None</option>
        {media
          .filter((m) =>
            pdf ? m.mime === "application/pdf" : m.mime.startsWith("image/"),
          )
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.alt} · {m.id.slice(0, 6)}
            </option>
          ))}
      </select>
    </label>
  );
}
function Feedback({ state }: { state: ActionResult }) {
  return state.message ? (
    <p
      role="status"
      className={`form-status ${state.ok ? "success" : "failure"}`}
    >
      {state.message}
    </p>
  ) : null;
}
export function ProfileEditor({
  initial,
  media,
}: {
  initial: Profile;
  media: Media[];
}) {
  const [data, setData] = useState(initial);
  const [state, setState] = useState<ActionResult>({ ok: false, message: "" });
  const [pending, start] = useTransition();
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  return (
    <form
      className="studio-form"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            setState(await saveDocument("profile", data));
          } catch {
            setState({ ok: false, message: "Could not save. Try again." });
          }
        });
      }}
    >
      <div className="studio-panel">
        <h2>Identity & copy</h2>
        <div className="form-grid">
          {(
            [
              "name",
              "handle",
              "role",
              "availability",
              "location",
              "email",
              "github",
              "linkedin",
              "instagram",
            ] as const
          ).map((k) => (
            <Field
              key={k}
              label={k}
              type={
                k === "email"
                  ? "email"
                  : ["github", "linkedin", "instagram"].includes(k)
                    ? "url"
                    : "text"
              }
              value={data[k]}
              onChange={(v) => set(k, v)}
            />
          ))}
        </div>
        <Field
          label="Headline (English)"
          value={data.headline}
          onChange={(v) => set("headline", v)}
          multiline
        />
        <Field
          label="Intro (English)"
          value={data.intro}
          onChange={(v) => set("intro", v)}
          multiline
        />
        <Field
          label="About (English)"
          value={data.about}
          onChange={(v) => set("about", v)}
          multiline
        />
        <details>
          <summary>Bahasa Indonesia (fallback: English)</summary>
          {(["headlineId", "introId", "aboutId"] as const).map((k) => (
            <Field
              key={k}
              label={k}
              value={data[k]}
              onChange={(v) => set(k, v)}
              multiline
            />
          ))}
        </details>
      </div>
      <div className="studio-panel">
        <h2>Independent portraits</h2>
        <p className="muted">
          Upload original photographs in Media Library, then select a different
          asset for each page. Crop position changes the vertical framing
          independently.
        </p>
        <div className="form-grid">
          <div>
            <MediaSelect
              label="Home portrait"
              value={data.homePortraitId}
              onChange={(v) => set("homePortraitId", v)}
              media={media}
            />
            <Field
              label="Home crop position (0–100%)"
              type="number"
              min={0}
              max={100}
              value={data.homePosition}
              onChange={(v) => set("homePosition", Number(v))}
            />
            {data.homePortraitId && (
              <div
                className="crop-preview"
                style={{
                  backgroundImage: `url(/media/${data.homePortraitId})`,
                  backgroundPosition: `50% ${data.homePosition}%`,
                }}
                role="img"
                aria-label="Home crop preview"
              />
            )}
          </div>
          <div>
            <MediaSelect
              label="About portrait"
              value={data.aboutPortraitId}
              onChange={(v) => set("aboutPortraitId", v)}
              media={media}
            />
            <Field
              label="About crop position (0–100%)"
              type="number"
              min={0}
              max={100}
              value={data.aboutPosition}
              onChange={(v) => set("aboutPosition", Number(v))}
            />
            {data.aboutPortraitId && (
              <div
                className="crop-preview"
                style={{
                  backgroundImage: `url(/media/${data.aboutPortraitId})`,
                  backgroundPosition: `50% ${data.aboutPosition}%`,
                }}
                role="img"
                aria-label="About crop preview"
              />
            )}
          </div>
        </div>
        <MediaSelect
          label="Résumé PDF"
          value={data.resumeId}
          onChange={(v) => set("resumeId", v)}
          media={media}
          pdf
        />
      </div>
      <div className="studio-panel">
        <h2>Capabilities</h2>
        {data.capabilities.map((c, i) => (
          <div className="editor-item" key={i}>
            <Field
              label="Capability"
              value={c.title}
              onChange={(v) =>
                set(
                  "capabilities",
                  data.capabilities.map((x, j) =>
                    i === j ? { ...x, title: v } : x,
                  ),
                )
              }
            />
            <Field
              label="Description"
              value={c.description}
              onChange={(v) =>
                set(
                  "capabilities",
                  data.capabilities.map((x, j) =>
                    i === j ? { ...x, description: v } : x,
                  ),
                )
              }
              multiline
            />
            <button
              type="button"
              className="text-button"
              onClick={() =>
                set(
                  "capabilities",
                  data.capabilities.filter((_, j) => j !== i),
                )
              }
            >
              Remove capability
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button button-outline"
          onClick={() =>
            set("capabilities", [
              ...data.capabilities,
              { title: "", description: "" },
            ])
          }
        >
          Add capability +
        </button>
      </div>
      <div className="save-bar">
        <button disabled={pending} className="button button-light">
          {pending ? "Saving…" : "Save profile"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
export function SettingsEditor({ initial }: { initial: Settings }) {
  const [data, setData] = useState(initial);
  const [state, setState] = useState<ActionResult>({ ok: false, message: "" });
  const [pending, start] = useTransition();
  return (
    <form
      className="studio-form"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setState(await saveDocument("settings", data)));
      }}
    >
      <div className="studio-panel">
        {(
          [
            "title",
            "description",
            "contactHeading",
            "contactIntro",
            "footer",
            "privacy",
          ] as const
        ).map((k) => (
          <Field
            key={k}
            label={k}
            value={data[k]}
            onChange={(v) => setData((d) => ({ ...d, [k]: v }))}
            multiline={[
              "privacy",
              "contactIntro",
              "description",
              "contactHeading",
            ].includes(k)}
          />
        ))}
        <div className="form-grid">
          <label>
            Default language
            <select
              value={data.locale}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  locale: e.target.value as Settings["locale"],
                }))
              }
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </label>
          <label>
            Default theme
            <select
              value={data.theme}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  theme: e.target.value as Settings["theme"],
                }))
              }
            >
              {["system", "dark", "light"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <button className="button button-light" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
const blockTypes: Block["type"][] = [
  "text",
  "heading",
  "image",
  "image-pair",
  "gallery",
  "video",
  "diagram",
  "code",
  "quote",
  "feature",
  "stack",
  "metric",
  "cta",
  "divider",
];
const emptyBlock = (type: Block["type"]): Block => ({
  id: crypto.randomUUID(),
  type,
  title: "",
  text: "",
  mediaId: "",
  mediaIds: [],
  caption: "",
  url: "",
  source: "",
  items: [],
});
export function ProjectEditor({
  initial,
  id,
  media,
  revisions = [],
}: {
  initial: ProjectInput;
  id: string | null;
  media: Media[];
  revisions?: { id: string; created_at: string }[];
}) {
  const [data, setData] = useState(initial);
  const [state, setState] = useState<ActionResult>({ ok: false, message: "" });
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  function editChapter(
    index: number,
    change: Partial<ProjectInput["chapters"][number]>,
  ) {
    set(
      "chapters",
      data.chapters.map((c, i) => (i === index ? { ...c, ...change } : c)),
    );
  }
  function editBlock(ci: number, bi: number, change: Partial<Block>) {
    editChapter(ci, {
      blocks: data.chapters[ci].blocks.map((b, i) =>
        i === bi ? { ...b, ...change } : b,
      ),
    });
  }
  function reorder<T>(items: T[], index: number, delta: number) {
    const copy = [...items];
    const target = index + delta;
    if (target >= 0 && target < copy.length)
      [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
  }
  return (
    <form
      className="studio-form"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            const result = await saveProject(id, data);
            setState(result);
            if (result.ok && result.id) {
              if (!id) router.replace(`/admin/projects/${result.id}/edit`);
              router.refresh();
            }
          } catch {
            setState({ ok: false, message: "Save failed. Please retry." });
          }
        });
      }}
    >
      <div className="studio-panel">
        <h2>Project identity</h2>
        <div className="form-grid">
          <Field
            label="Title"
            required
            value={data.title}
            onChange={(v) => set("title", v)}
          />
          <Field
            label="Slug"
            required
            value={data.slug}
            onChange={(v) => set("slug", v)}
          />
          <Field
            label="Category"
            value={data.category}
            onChange={(v) => set("category", v)}
          />
          <Field
            label="My role"
            value={data.role}
            onChange={(v) => set("role", v)}
          />
          <label>
            Collaboration
            <select
              value={data.collaboration}
              onChange={(e) =>
                set(
                  "collaboration",
                  e.target.value as ProjectInput["collaboration"],
                )
              }
            >
              {["Personal", "Team", "Client", "Academic"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <Field
            label="Timeframe"
            value={data.timeframe}
            onChange={(v) => set("timeframe", v)}
          />
        </div>
        <Field
          label="Quick-read summary"
          value={data.summary}
          onChange={(v) => set("summary", v)}
          multiline
        />
        <Field
          label="Project context"
          value={data.context}
          onChange={(v) => set("context", v)}
          multiline
        />
        <Field
          label="My personal contribution"
          value={data.contribution}
          onChange={(v) => set("contribution", v)}
          multiline
        />
        <Field
          label="Team members / attribution"
          value={data.team}
          onChange={(v) => set("team", v)}
          multiline
        />
        <div className="form-grid">
          <Field
            label="Stack (comma separated)"
            value={data.stack.join(", ")}
            onChange={(v) =>
              set(
                "stack",
                v.split(",").map((x) => x.trim()),
              )
            }
          />
          <Field
            label="Tags (comma separated)"
            value={data.tags.join(", ")}
            onChange={(v) =>
              set(
                "tags",
                v.split(",").map((x) => x.trim()),
              )
            }
          />
          <MediaSelect
            label="Cover"
            value={data.coverId}
            media={media}
            onChange={(v) => set("coverId", v)}
          />
          <Field
            label="Source URL"
            value={data.sourceUrl}
            onChange={(v) => set("sourceUrl", v)}
          />
          <Field
            label="Demo URL"
            value={data.demoUrl}
            onChange={(v) => set("demoUrl", v)}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.demoVerified}
              onChange={(e) => set("demoVerified", e.target.checked)}
            />
            I checked the demo and it works
          </label>
        </div>
      </div>
      <div className="studio-panel">
        <div className="editor-header">
          <div>
            <h2>Case study chapters</h2>
            <p className="muted">
              Content is rendered as safe blocks. HTML and scripts are displayed
              as text.
            </p>
          </div>
          <button
            className="button button-outline"
            type="button"
            onClick={() =>
              set("chapters", [
                ...data.chapters,
                {
                  id: crypto.randomUUID(),
                  title: "New chapter",
                  visible: true,
                  blocks: [],
                },
              ])
            }
          >
            Add chapter +
          </button>
        </div>
        {data.chapters.map((chapter, ci) => (
          <section key={chapter.id} className="chapter-editor">
            <div className="editor-toolbar">
              <span className="mono">CHAPTER {ci + 1}</span>
              <button
                type="button"
                aria-label={`Move chapter ${ci + 1} up`}
                disabled={ci === 0}
                onClick={() => set("chapters", reorder(data.chapters, ci, -1))}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move chapter ${ci + 1} down`}
                disabled={ci === data.chapters.length - 1}
                onClick={() => set("chapters", reorder(data.chapters, ci, 1))}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() =>
                  set(
                    "chapters",
                    data.chapters.filter((_, i) => ci !== i),
                  )
                }
              >
                Remove chapter
              </button>
            </div>
            <Field
              label="Chapter title"
              value={chapter.title}
              onChange={(v) => editChapter(ci, { title: v })}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={chapter.visible}
                onChange={(e) => editChapter(ci, { visible: e.target.checked })}
              />
              Visible chapter
            </label>
            {chapter.blocks.map((block, bi) => (
              <div className="block-editor" key={block.id}>
                <div className="editor-toolbar">
                  <label>
                    Block type
                    <select
                      value={block.type}
                      onChange={(e) =>
                        editBlock(ci, bi, {
                          type: e.target.value as Block["type"],
                        })
                      }
                    >
                      {blockTypes.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    aria-label="Move block up"
                    disabled={bi === 0}
                    onClick={() =>
                      editChapter(ci, {
                        blocks: reorder(chapter.blocks, bi, -1),
                      })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move block down"
                    disabled={bi === chapter.blocks.length - 1}
                    onClick={() =>
                      editChapter(ci, {
                        blocks: reorder(chapter.blocks, bi, 1),
                      })
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editChapter(ci, {
                        blocks: chapter.blocks.filter((_, i) => i !== bi),
                      })
                    }
                  >
                    Remove block
                  </button>
                </div>
                {["heading", "feature", "metric", "cta", "video"].includes(
                  block.type,
                ) && (
                  <Field
                    label="Block title"
                    value={block.title}
                    onChange={(v) => editBlock(ci, bi, { title: v })}
                  />
                )}{" "}
                {[
                  "text",
                  "heading",
                  "code",
                  "quote",
                  "feature",
                  "metric",
                  "video",
                ].includes(block.type) && (
                  <Field
                    label={
                      block.type === "video" ? "Video transcript" : "Content"
                    }
                    value={block.text}
                    onChange={(v) => editBlock(ci, bi, { text: v })}
                    multiline
                  />
                )}
                {["image", "diagram"].includes(block.type) && (
                  <MediaSelect
                    label="Image asset"
                    value={block.mediaId}
                    media={media}
                    onChange={(v) => editBlock(ci, bi, { mediaId: v })}
                  />
                )}{" "}
                {["gallery", "image-pair"].includes(block.type) && (
                  <fieldset>
                    <legend>Select gallery images</legend>
                    {media
                      .filter((m) => m.mime.startsWith("image/"))
                      .map((m) => (
                        <label className="checkbox-label" key={m.id}>
                          <input
                            type="checkbox"
                            checked={block.mediaIds.includes(m.id)}
                            onChange={(e) =>
                              editBlock(ci, bi, {
                                mediaIds: e.target.checked
                                  ? [...block.mediaIds, m.id]
                                  : block.mediaIds.filter((x) => x !== m.id),
                              })
                            }
                          />
                          {m.alt}
                        </label>
                      ))}
                  </fieldset>
                )}
                {["video", "cta"].includes(block.type) && (
                  <Field
                    label={
                      block.type === "video"
                        ? "Privacy-enhanced YouTube or Vimeo embed URL"
                        : "Link URL"
                    }
                    value={block.url}
                    onChange={(v) => editBlock(ci, bi, { url: v })}
                  />
                )}{" "}
                {["image", "diagram", "video"].includes(block.type) && (
                  <Field
                    label="Caption"
                    value={block.caption}
                    onChange={(v) => editBlock(ci, bi, { caption: v })}
                  />
                )}{" "}
                {["metric", "quote"].includes(block.type) && (
                  <Field
                    label="Evidence source / attribution"
                    value={block.source}
                    onChange={(v) => editBlock(ci, bi, { source: v })}
                  />
                )}{" "}
                {block.type === "stack" && (
                  <Field
                    label="Items (one per line)"
                    value={block.items.join("\n")}
                    onChange={(v) =>
                      editBlock(ci, bi, { items: v.split("\n") })
                    }
                    multiline
                  />
                )}
              </div>
            ))}
            <button
              className="button button-outline"
              type="button"
              onClick={() =>
                editChapter(ci, {
                  blocks: [...chapter.blocks, emptyBlock("text")],
                })
              }
            >
              Add block +
            </button>
          </section>
        ))}
      </div>
      <div className="studio-panel">
        <h2>Publication & discovery</h2>
        <div className="form-grid">
          <label>
            Status
            <select
              aria-label="Status"
              value={data.status}
              onChange={(e) =>
                set("status", e.target.value as ProjectInput["status"])
              }
            >
              {["draft", "published", "archived"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <Field
            label="Display order"
            type="number"
            min={0}
            max={9999}
            value={data.order}
            onChange={(v) => set("order", Number(v))}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            Featured on Home
          </label>
          <label>
            Content language
            <select
              value={data.locale}
              onChange={(e) => set("locale", e.target.value as "en" | "id")}
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </label>
        </div>
        <Field
          label="SEO title"
          value={data.seoTitle}
          onChange={(v) => set("seoTitle", v)}
        />
        <Field
          label="SEO description"
          value={data.seoDescription}
          onChange={(v) => set("seoDescription", v)}
          multiline
        />
        <p className="small muted">
          Before publishing, verify attribution, evidence, links, and media
          rights. Drafts and archives are private.
        </p>
      </div>
      <div className="save-bar">
        <button className="button button-light" disabled={pending}>
          {pending ? "Saving…" : "Save project"}
        </button>
        {id && (
          <Link
            className="button button-outline"
            href={`/admin/projects/${id}/preview`}
          >
            Preview saved version ↗
          </Link>
        )}
        <Feedback state={state} />
      </div>
      {id && revisions.length > 0 && (
        <details className="studio-panel">
          <summary>Previous versions (restore as draft)</summary>
          {revisions.map((r) => (
            <div className="revision" key={r.id}>
              <span>
                {new Date(r.created_at).toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                })}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await restoreRevision(id, r.id);
                    setState(result);
                    if (result.ok) location.reload();
                  })
                }
              >
                Restore as draft
              </button>
            </div>
          ))}
        </details>
      )}
    </form>
  );
}
const emptyRecord = {
  name: "",
  category: "",
  summary: "",
  visible: false,
  order: 0,
  projectIds: [],
  issuer: "",
  issued: "",
  expiry: "",
  credentialId: "",
  credentialUrl: "",
  mediaId: "",
  certificateType: "Certification" as const,
};
export function RecordsEditor({
  kind,
  records,
  media,
  projects,
}: {
  kind: "skill" | "certification";
  records: ContentRecord[];
  media: Media[];
  projects: { id: string; title: string }[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<Omit<ContentRecord, "id" | "kind">>({
    ...emptyRecord,
  });
  const [state, setState] = useState<ActionResult>({ ok: false, message: "" });
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="records-layout">
      <aside className="studio-panel">
        <button
          className="button button-light"
          onClick={() => {
            setSelected(null);
            setData({ ...emptyRecord });
          }}
        >
          New {kind} +
        </button>
        {records.map((r) => (
          <button
            className={`record-choice ${selected === r.id ? "selected" : ""}`}
            key={r.id}
            onClick={() => {
              setSelected(r.id);
              setData(r);
              setState({ ok: false, message: "" });
            }}
          >
            {r.name}
            <small>{r.visible ? "Visible" : "Hidden"}</small>
          </button>
        ))}
      </aside>
      <form
        className="studio-panel stack"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setState(await saveRecord(kind, selected, data));
            router.refresh();
          });
        }}
      >
        <h2>
          {selected ? "Edit" : "New"} {kind}
        </h2>
        <Field
          label="Name"
          value={data.name}
          onChange={(v) => setData((d) => ({ ...d, name: v }))}
          required
        />
        <Field
          label="Category"
          value={data.category}
          onChange={(v) => setData((d) => ({ ...d, category: v }))}
        />
        <Field
          label="Summary"
          value={data.summary}
          onChange={(v) => setData((d) => ({ ...d, summary: v }))}
          multiline
        />
        {kind === "certification" ? (
          <>
            {(
              [
                "issuer",
                "issued",
                "expiry",
                "credentialId",
                "credentialUrl",
              ] as const
            ).map((k) => (
              <Field
                key={k}
                label={k}
                value={data[k]}
                onChange={(v) => setData((d) => ({ ...d, [k]: v }))}
              />
            ))}
            <label>
              Type
              <select
                value={data.certificateType}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    certificateType: e.target.value as
                      "Certification" | "Course Completion",
                  }))
                }
              >
                <option>Certification</option>
                <option>Course Completion</option>
              </select>
            </label>
            <label>
              Certificate asset
              <select
                value={data.mediaId}
                onChange={(e) =>
                  setData((d) => ({ ...d, mediaId: e.target.value }))
                }
              >
                <option value="">None</option>
                {media.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.alt}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <fieldset>
            <legend>Evidence projects</legend>
            {projects.map((p) => (
              <label key={p.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={data.projectIds.includes(p.id)}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      projectIds: e.target.checked
                        ? [...d.projectIds, p.id]
                        : d.projectIds.filter((x) => x !== p.id),
                    }))
                  }
                />
                {p.title}
              </label>
            ))}
          </fieldset>
        )}
        <Field
          label="Display order"
          type="number"
          min={0}
          max={9999}
          value={data.order}
          onChange={(v) => setData((d) => ({ ...d, order: Number(v) }))}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={data.visible}
            onChange={(e) =>
              setData((d) => ({ ...d, visible: e.target.checked }))
            }
          />
          Publicly visible
        </label>
        <div className="inline-links">
          <button className="button button-light" disabled={pending}>
            {pending ? "Saving…" : "Save item"}
          </button>
          {selected && (
            <button
              type="button"
              className="text-button danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setState(await deleteRecord(selected));
                  setSelected(null);
                  setData({ ...emptyRecord });
                  router.refresh();
                })
              }
            >
              Delete item
            </button>
          )}
        </div>
        <Feedback state={state} />
      </form>
    </div>
  );
}
