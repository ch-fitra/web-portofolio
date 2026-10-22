import { requireOwner } from "@/lib/auth";
import Link from "next/link";
import { getProjects } from "@/lib/content";
import { StudioHeading } from "@/components/studio/heading";
export default async function ProjectsPage() {
  await requireOwner();
  const projects = await getProjects(true);
  return (
    <>
      <StudioHeading title="The work, in progress." />
      <Link className="button button-light" href="/admin/projects/new">
        New project +
      </Link>
      <div className="studio-table">
        {projects.map((p) => (
          <div key={p.id}>
            <span className={`badge ${p.status}`}>{p.status}</span>
            <div>
              <h3>{p.title}</h3>
              <small className="muted">
                /{p.slug} · {p.collaboration}
              </small>
            </div>
            <Link className="text-link" href={`/admin/projects/${p.id}/edit`}>
              Edit ↗
            </Link>
            <Link
              className="text-link"
              href={`/admin/projects/${p.id}/preview`}
            >
              Preview ↗
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
