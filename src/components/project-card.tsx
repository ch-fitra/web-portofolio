import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/schema";
export function ProjectCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  return (
    <Link
      className="project-card"
      href={`/projects/${project.slug}`}
      data-enter="panel"
      style={{ animationDelay: `${400 + Math.min(index, 5) * 70}ms` }}
    >
      <div className="project-cover">
        {project.coverId ? (
          <Image
            src={`/media/${project.coverId}`}
            alt={`${project.title} project cover`}
            fill
            unoptimized
            sizes="(max-width:760px) 100vw, 50vw"
          />
        ) : (
          <div className="project-cover-placeholder" aria-hidden="true">
            <div className="mini-pipeline">
              <span>INPUT</span>
              <i />
              <span>{project.category || "SYSTEM"}</span>
              <i />
              <span>OUTPUT</span>
            </div>
            <span className="cover-title">{project.title}</span>
          </div>
        )}
        <span className="project-index">
          {String(index + 1).padStart(2, "0")} / {project.collaboration}
        </span>
        <span className="round-arrow">
          <ArrowUpRight size={21} />
        </span>
      </div>
      <div className="project-card-meta">
        <span className="eyebrow">{project.category}</span>
        <span className="muted mono">{project.role}</span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.summary}</p>
      <div className="chips">
        {project.stack.slice(0, 4).map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
    </Link>
  );
}
