import { getProjects } from "@/lib/content";
import { ProjectShowcase } from "@/components/project-showcase";
export default async function Projects() {
  return (
    <div className="container page-space projects-page">
      <ProjectShowcase projects={await getProjects()} />
    </div>
  );
}
