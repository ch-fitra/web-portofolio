import { requireOwner } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/lib/db";
import { getProjects, getRecords } from "@/lib/content";
import { StudioHeading } from "@/components/studio/heading";
export default async function Dashboard() {
  await requireOwner();
  const [projects, skills, certs, inbox] = await Promise.all([
    getProjects(true),
    getRecords("skill", true),
    getRecords("certification", true),
    db("owner").query(
      "SELECT count(*)::int n FROM messages WHERE status='unread'",
    ),
  ]);
  return (
    <>
      <StudioHeading
        title="Make it your own."
        description="A considered portfolio starts with accurate, thoughtful content."
      />
      <div className="dashboard-stats">
        {[
          [
            "Published projects",
            projects.filter((p) => p.status === "published").length,
          ],
          [
            "Draft projects",
            projects.filter((p) => p.status === "draft").length,
          ],
          ["Skills", skills.length],
          ["Certificates", certs.length],
          ["Unread inquiries", inbox.rows[0].n],
        ].map(([label, n]) => (
          <div className="studio-panel" key={label}>
            <span className="muted">{label}</span>
            <strong>{n}</strong>
          </div>
        ))}
      </div>
      <section className="studio-panel">
        <h2>Start with the essentials.</h2>
        <div className="quick-actions">
          <Link href="/admin/profile">
            01 / Update your profile & two portraits ↗
          </Link>
          <Link href="/admin/projects/new">
            02 / Tell the story of a project ↗
          </Link>
          <Link href="/admin/inbox">03 / Read your conversations ↗</Link>
        </div>
        <p className="muted">
          Candidate projects remain drafts until you review attribution, claims,
          media rights, and evidence. No AI assistant is active.
        </p>
      </section>
    </>
  );
}
