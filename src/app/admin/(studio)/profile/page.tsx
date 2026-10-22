import { requireOwner } from "@/lib/auth";
import { getProfile } from "@/lib/content";
import { db } from "@/lib/db";
import { ProfileEditor } from "@/components/studio/forms";
import { StudioHeading } from "@/components/studio/heading";
export default async function ProfilePage() {
  await requireOwner();
  const [profile, media] = await Promise.all([
    getProfile(),
    db("owner").query("SELECT * FROM media ORDER BY created_at DESC"),
  ]);
  return (
    <>
      <StudioHeading title="The person behind the work." />
      <ProfileEditor initial={profile} media={media.rows} />
    </>
  );
}
