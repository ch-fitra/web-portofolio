"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import type { Project } from "@/lib/schema";
import { ProjectCard } from "./project-card";
export function ProjectFilter({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [technology, setTechnology] = useState("All");
  const [sort, setSort] = useState("featured");
  const categories = ["All", ...new Set(projects.map((p) => p.category))];
  const technologies = [...new Set(projects.flatMap((p) => p.stack))].sort();
  const results = projects
    .filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (technology === "All" || p.stack.includes(technology)) &&
        `${p.title} ${p.summary} ${p.stack.join(" ")} ${p.tags.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "recent"
        ? b.updated_at.localeCompare(a.updated_at)
        : Number(b.featured) - Number(a.featured) || a.order - b.order,
    );
  return (
    <>
      <div
        className="filter-bar"
        data-enter="panel"
        style={{ animationDelay: "240ms" }}
      >
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Search projects"
            placeholder="Search the work…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by technology"
          value={technology}
          onChange={(e) => setTechnology(e.target.value)}
        >
          <option>All</option>
          {technologies.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          aria-label="Sort projects"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="featured">Featured first</option>
          <option value="recent">Most recent</option>
        </select>
      </div>
      <div
        className="filter-tabs"
        data-enter="actions"
        style={{ animationDelay: "320ms" }}
      >
        {categories.map((c) => (
          <button
            className={c === category ? "selected" : ""}
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={c === category}
          >
            {c}
          </button>
        ))}
        {(query || category !== "All" || technology !== "All") && (
          <button
            onClick={() => {
              setQuery("");
              setCategory("All");
              setTechnology("All");
            }}
          >
            Clear filters ×
          </button>
        )}
      </div>
      <p
        className="result-count mono"
        aria-live="polite"
        data-enter="text"
        style={{ animationDelay: "380ms" }}
      >
        {results.length} {results.length === 1 ? "PROJECT" : "PROJECTS"}
      </p>
      {results.length ? (
        <div className="project-grid">
          {results.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      ) : projects.length ? (
        <div className="empty-state">
          <h2>No matching projects.</h2>
          <p>Try a different search or clear your filters.</p>
        </div>
      ) : null}
    </>
  );
}
