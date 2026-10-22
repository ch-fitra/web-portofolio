import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { MediaLibrary } from "@/components/studio/media-library";
import { StudioHeading } from "@/components/studio/heading";
export default async function MediaPage() {
  await requireOwner();
  return (
    <>
      <StudioHeading title="An asset for every story." />
      <MediaLibrary
        media={
          (
            await db("owner").query(
              "SELECT * FROM media ORDER BY created_at DESC",
            )
          ).rows
        }
      />
    </>
  );
}
