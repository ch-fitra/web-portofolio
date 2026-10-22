import { getSettings } from "@/lib/content";
import { PageIntro } from "@/components/shell";
export const metadata = {
  title: "Privacy",
  alternates: { canonical: "/privacy" },
};
export default async function Privacy() {
  const s = await getSettings();
  return (
    <div className="container page-space">
      <PageIntro
        eyebrow="PRIVACY / YOUR INFORMATION"
        title="A little transparency."
      />
      <div
        className="prose story-text"
        data-enter="panel"
        style={{ animationDelay: "240ms" }}
      >
        {s.privacy}
      </div>
    </div>
  );
}
