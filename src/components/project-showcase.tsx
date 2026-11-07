import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/schema";
import { ProjectCarousel } from "./project-carousel";

export function ProjectShowcase({ projects }: { projects: Project[] }) {
  const ordered = [...projects].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order,
  );

  return (
    <>
      <header className="project-showcase-heading">
        <div>
          <p className="eyebrow">PROJECTS / PROOF OF WORK</p>
          <h2>
            Ideas, made real<span>.</span>
          </h2>
        </div>
        {projects.length > 0 && (
          <Link href="/projects" className="text-link showcase-view-all">
            View all projects <ArrowUpRight size={17} />
          </Link>
        )}
      </header>
      <div id="project-collection">
        {projects.length === 0 ? (
          <div className="showcase-empty">
            <span className="eyebrow">IN THE MAKING</span>
            <h3>Good work takes shape here.</h3>
            <p>Case studies are on their way. Check back soon.</p>
          </div>
        ) : (
          <ProjectCarousel projects={ordered} />
        )}
      </div>
    </>
  );
}
