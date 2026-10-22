import { requireOwner } from "@/lib/auth";
import { getRecords } from "@/lib/content";
import { db } from "@/lib/db";
import { RecordsEditor } from "@/components/studio/forms";
import { StudioHeading } from "@/components/studio/heading";
export default async function CertificationsPage() {
  await requireOwner();
  const [records, media] = await Promise.all([
    getRecords("certification", true),
    db("owner").query("SELECT * FROM media"),
  ]);
  return (
    <>
      <StudioHeading title="Learning, with evidence." />
      <RecordsEditor
        kind="certification"
        records={records}
        media={media.rows}
        projects={[]}
      />
    </>
  );
}
