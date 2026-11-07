import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getProjects } from "@/lib/content";
import { ProjectFilter } from "@/components/project-filter";
import { PortfolioSectionLink } from "@/components/portfolio-navigation";
import styles from "./projects.module.css";

export const metadata: Metadata = {
  title: "All projects",
  description:
    "Explore the projects, technology, and contributions behind the work of Chairul Fitra Ramadhan.",
  alternates: { canonical: "/projects" },
};

export default async function Page() {
  const projects = await getProjects();
  return (
    <div className={`container ${styles.page}`}>
      <PortfolioSectionLink section="projects" className="text-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to portfolio
      </PortfolioSectionLink>
      <header className={styles.heading}>
        <h1 data-enter="text">
          All projects<span>.</span>
        </h1>
        <p data-enter="text">
          A closer look at the work, the tools, and my contribution.
        </p>
      </header>
      {projects.length ? (
        <ProjectFilter projects={projects} />
      ) : (
        <div className="empty-state">
          <h2>Projects are on their way.</h2>
          <p>Published projects will appear here.</p>
        </div>
      )}
    </div>
  );
}
