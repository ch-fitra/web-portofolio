import { requireOwner } from "@/lib/auth";
import { getRecords, getProjects } from "@/lib/content";
import { db } from "@/lib/db";
import { RecordsEditor } from "@/components/studio/forms";
import { StudioHeading } from "@/components/studio/heading";
export default async function SkillsPage() {
  await requireOwner();
  const [records, projects, media] = await Promise.all([
    getRecords("skill", true),
    getProjects(true),
    db("owner").query("SELECT * FROM media"),
  ]);
  return (
    <>
      <StudioHeading title="A practical toolkit." />
      <RecordsEditor
        kind="skill"
        records={records}
        media={media.rows}
        projects={projects.map((p) => ({ id: p.id, title: p.title }))}
      />
    </>
  );
}
