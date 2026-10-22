import { requireOwner } from "@/lib/auth";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { uuid } from "@/lib/schema";
import { ProjectEditor } from "@/components/studio/forms";
import { StudioHeading } from "@/components/studio/heading";
export default async function EditProject({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const [p, media, revisions] = await Promise.all([
    db("owner").query("SELECT data FROM projects WHERE id=$1", [id]),
    db("owner").query("SELECT * FROM media ORDER BY created_at DESC"),
    db("owner").query(
      "SELECT id,created_at FROM revisions WHERE project_id=$1 ORDER BY created_at DESC LIMIT 20",
      [id],
    ),
  ]);
  if (!p.rows[0]) notFound();
  return (
    <>
      <StudioHeading title="Shape the story." />
      <ProjectEditor
        key={id}
        initial={p.rows[0].data}
        id={id}
        media={media.rows}
        revisions={revisions.rows.map((r) => ({
          ...r,
          created_at: r.created_at.toISOString(),
        }))}
      />
    </>
  );
}
