import Link from "next/link";
import { getRecords, getProjects, getSettings } from "@/lib/content";
import { techStack } from "@/lib/tech-stack";
import { TechIcon, techBrandStyle } from "./tech-icon";
import styles from "./skills.module.css";

export default async function Skills() {
  const [records, certificates, projects, settings] = await Promise.all([
    getRecords("skill"),
    getRecords("certification"),
    getProjects(),
    getSettings(),
  ]);
  const skills = records.filter(
    (skill) => skill.category !== "DevOps & Infrastructure",
  );
  const id = settings.locale === "id";
  const present = [...new Set(skills.map((skill) => skill.category))];
  const categories = [
    ...techStack
      .map((group) => group.title)
      .filter((name) => present.includes(name)),
    ...present.filter(
      (name) => !techStack.some((group) => group.title === name),
    ),
  ];
  return (
    <div className={`container skills-page ${styles.page}`}>
      <header className={styles.heading}>
        <div>
          <h2 data-enter="text">
            Tech stack<span>.</span>
          </h2>
        </div>
        {skills.length > 0 && (
          <dl className={styles.totals} data-enter="label">
            <div>
              <dt>{id ? "Teknologi" : "Technologies"}</dt>
              <dd>{String(skills.length).padStart(2, "0")}</dd>
            </div>
            <div>
              <dt>{id ? "Kategori" : "Areas"}</dt>
              <dd>{String(categories.length).padStart(2, "0")}</dd>
            </div>
          </dl>
        )}
      </header>

      <div className={styles.groups}>
        {categories.map((category, index) => {
          const items = skills.filter((skill) => skill.category === category);
          return (
            <section
              key={category}
              className={styles.row}
              aria-labelledby={`tech-category-${index}`}
            >
              <div className={styles.category} data-enter="text">
                <h3 id={`tech-category-${index}`}>{category}</h3>
              </div>
              <ul className={styles.technologies} data-count={items.length}>
                {items.map((skill, i) => (
                  <li
                    className={styles.technology}
                    key={skill.id}
                    data-enter="panel"
                    style={{
                      ...techBrandStyle(skill.name),
                      animationDelay: `${Math.min(i, 5) * 45}ms`,
                    }}
                  >
                    <span className={styles.icon}>
                      <TechIcon name={skill.name} />
                    </span>
                    <h4>{skill.name}</h4>
                    {skill.summary && <p>{skill.summary}</p>}
                    {projects
                      .filter((p) => skill.projectIds.includes(p.id))
                      .map((p) => (
                        <Link
                          className={styles.evidence}
                          key={p.id}
                          href={`/projects/${p.slug}`}
                        >
                          {p.title} ↗
                        </Link>
                      ))}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {!skills.length && (
        <p className="empty-state">
          {id
            ? "Teknologi akan tampil setelah ditambahkan melalui Studio."
            : "The toolkit will appear here once skills are published."}
        </p>
      )}

      {certificates.length > 0 && (
        <section className={styles.certificates}>
          <h3>{id ? "Sertifikasi & kursus" : "Certifications & courses"}</h3>
          <div className={styles.certificateGrid}>
            {certificates.map((c) => (
              <article key={c.id}>
                <span className="eyebrow">{c.certificateType}</span>
                <h4>{c.name}</h4>
                <p>{[c.issuer, c.issued].filter(Boolean).join(" · ")}</p>
                {c.expiry && (
                  <p>
                    {id ? "Berlaku hingga" : "Expires"}: {c.expiry}
                  </p>
                )}
                {c.summary && <p>{c.summary}</p>}
                {c.credentialId && <p>Credential: {c.credentialId}</p>}
                {c.credentialUrl && (
                  <a
                    className="text-link"
                    href={c.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {id ? "Verifikasi kredensial" : "Verify credential"} ↗
                  </a>
                )}
                {c.mediaId && (
                  <a
                    className="text-link"
                    href={`/media/${c.mediaId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {id ? "Lihat sertifikat" : "View certificate"} ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
