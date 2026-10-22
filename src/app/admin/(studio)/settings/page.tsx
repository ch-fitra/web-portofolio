import { requireOwner } from "@/lib/auth";
import { getSettings } from "@/lib/content";
import { SettingsEditor } from "@/components/studio/forms";
import { StudioHeading } from "@/components/studio/heading";
export default async function SettingsPage() {
  await requireOwner();
  return (
    <>
      <StudioHeading title="Site settings." />
      <SettingsEditor initial={await getSettings()} />
    </>
  );
}
