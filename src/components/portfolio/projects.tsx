import { getProjects } from "@/lib/content";
import { PageIntro } from "@/components/shell";
import { ProjectFilter } from "@/components/project-filter";
export default async function Projects() {
  return (
    <div className="container page-space">
      <PageIntro
        heading="h2"
        eyebrow="PROJECTS / PROOF OF WORK"
        title="Ideas, made real."
        description="A closer look at the problems, the process, and the decisions behind the work."
      />
      <ProjectFilter projects={await getProjects()} />
    </div>
  );
}
