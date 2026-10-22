import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectEditor } from "@/components/studio/forms";
import { StudioHeading } from "@/components/studio/heading";
import type { ProjectInput } from "@/lib/schema";
export default async function NewProject() {
  await requireOwner();
  const { rows } = await db("owner").query(
    "SELECT * FROM media ORDER BY created_at DESC",
  );
  const initial: ProjectInput = {
    title: "",
    slug: "",
    summary: "",
    category: "AI/ML",
    role: "",
    collaboration: "Personal",
    context: "",
    contribution: "",
    stack: [],
    tags: [],
    timeframe: "",
    team: "",
    coverId: "",
    sourceUrl: "",
    demoUrl: "",
    demoVerified: false,
    status: "draft",
    featured: false,
    order: 0,
    seoTitle: "",
    seoDescription: "",
    locale: "en",
    chapters: [],
  };
  return (
    <>
      <StudioHeading title="A new story." />
      <ProjectEditor initial={initial} id={null} media={rows} />
    </>
  );
}
