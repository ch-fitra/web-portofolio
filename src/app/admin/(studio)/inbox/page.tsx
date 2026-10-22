import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateMessage } from "@/app/actions";
import { StudioHeading } from "@/components/studio/heading";
export default async function Inbox({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireOwner();
  const q = await searchParams;
  const { rows } = await db("owner").query(
    "SELECT * FROM messages WHERE ($1='' OR name ILIKE $1 OR email ILIKE $1 OR message ILIKE $1) AND ($2='' OR status=$2) ORDER BY created_at DESC LIMIT 100",
    [q.q ? `%${q.q.slice(0, 100)}%` : "", q.status || ""],
  );
  return (
    <>
      <StudioHeading
        title="Conversations start here."
        description="Private inquiries. Email status refers to notification acceptance, not confirmed delivery."
      />
      <form className="filter-bar">
        <input
          name="q"
          placeholder="Search name, email, message"
          aria-label="Search inbox"
          defaultValue={q.q}
        />
        <select
          name="status"
          aria-label="Filter inbox status"
          defaultValue={q.status || ""}
        >
          <option value="">All statuses</option>
          {["unread", "read", "archived", "spam"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="button button-outline">Filter</button>
      </form>
      {!rows.length && (
        <div className="empty-state">
          <h2>A quiet inbox.</h2>
          <p>New inquiries will appear here.</p>
        </div>
      )}
      {rows.map((m) => (
        <article className="studio-panel inbox-message" key={m.id}>
          <div className="editor-header">
            <span className="badge">
              {m.status} / {m.type}
            </span>
            <time className="mono small">{m.created_at.toISOString()}</time>
          </div>
          <h2>{m.name}</h2>
          <a className="text-link" href={`mailto:${m.email}`}>
            {m.email}
          </a>
          <p className="story-text">{m.message}</p>
          {m.budget && <p>Budget: {m.budget}</p>}
          {m.timeline && <p>Timeline: {m.timeline}</p>}
          <p className="mono small muted">NOTIFICATION: {m.notification}</p>
          <div className="inline-links">
            {["read", "unread", "archived", "spam", "delete"].map((status) => (
              <form
                key={status}
                action={async () => {
                  "use server";
                  await updateMessage(m.id, status);
                }}
              >
                <button className="text-button">
                  {status === "delete"
                    ? "Delete permanently"
                    : `Mark ${status}`}
                </button>
              </form>
            ))}
          </div>
        </article>
      ))}
    </>
  );
}
