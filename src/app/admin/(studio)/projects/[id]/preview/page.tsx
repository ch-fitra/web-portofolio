import { requireOwner } from "@/lib/auth";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { uuid } from "@/lib/schema";
import { ProjectStory } from "@/components/chapters";
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const { rows } = await db("owner").query(
    "SELECT id,data FROM projects WHERE id=$1",
    [id],
  );
  if (!rows[0]) notFound();
  const p = { ...rows[0].data, id };
  return (
    <>
      <p className="preview-banner">
        PRIVATE PREVIEW / {p.status.toUpperCase()} / saved version only
      </p>
      <header className="project-intro">
        <p className="eyebrow">{p.category}</p>
        <h1>{p.title}</h1>
        <p className="lede">{p.summary}</p>
      </header>
      <ProjectStory project={p} preview />
    </>
  );
}
