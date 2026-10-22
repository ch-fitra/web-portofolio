import { getRecords, getProjects } from "@/lib/content";
import { PageIntro } from "@/components/shell";
import Link from "next/link";
export default async function Skills() {
  const [skills, certificates, projects] = await Promise.all([
    getRecords("skill"),
    getRecords("certification"),
    getProjects(),
  ]);
  const categories = [...new Set(skills.map((x) => x.category))];
  return (
    <div className="container">
      <PageIntro
        heading="h2"
        eyebrow="SKILLS / A PRACTICAL TOOLKIT"
        title="The tools. The thinking."
        description="Skills connected to work, with room to keep learning."
      />
      {categories.length ? (
        categories.map((c) => (
          <section
            className="skill-section"
            key={c}
            data-enter="panel"
            style={{ animationDelay: "250ms" }}
          >
            <h2>{c}</h2>
            <div className="skills-grid">
              {skills
                .filter((x) => x.category === c)
                .map((x) => (
                  <article key={x.id}>
                    <h3>{x.name}</h3>
                    <p>{x.summary}</p>
                    {projects
                      .filter((p) => x.projectIds.includes(p.id))
                      .map((p) => (
                        <Link
                          key={p.id}
                          className="text-link"
                          href={`/projects/${p.slug}`}
                        >
                          {p.title} ↗
                        </Link>
                      ))}
                  </article>
                ))}
            </div>
          </section>
        ))
      ) : (
        <div
          className="empty-state"
          data-enter="panel"
          style={{ animationDelay: "250ms" }}
        >
          <h2>Evidence comes first.</h2>
          <p>
            Skills will be listed here after they have been reviewed and linked
            to the work.
          </p>
        </div>
      )}
      <section
        className="section"
        data-enter="panel"
        style={{ animationDelay: "340ms" }}
      >
        <p className="eyebrow">CONTINUED LEARNING</p>
        <h2>Certifications & courses.</h2>
        {certificates.length ? (
          <div className="skills-grid">
            {certificates.map((c) => (
              <article key={c.id}>
                <span className="eyebrow">{c.certificateType}</span>
                <h3>{c.name}</h3>
                <p>
                  {c.issuer} · {c.issued}
                </p>
                {c.expiry && <p>Expires: {c.expiry}</p>}
                <p>{c.summary}</p>
                {c.credentialId && (
                  <p className="mono">Credential: {c.credentialId}</p>
                )}
                {c.credentialUrl && (
                  <a
                    className="text-link"
                    href={c.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Verify credential ↗
                  </a>
                )}
                {c.mediaId && (
                  <a
                    className="text-link"
                    href={`/media/${c.mediaId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View certificate ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">
            No verified certificates have been published yet.
          </p>
        )}
      </section>
    </div>
  );
}
