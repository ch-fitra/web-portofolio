import { getProfile, getSettings } from "@/lib/content";
import { PageIntro } from "@/components/shell";
import { ContactForm } from "@/components/contact-form";
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [p, s, q] = await Promise.all([
    getProfile(),
    getSettings(),
    searchParams,
  ]);
  return (
    <div className="container contact-page">
      <div className="contact-layout">
        <aside className="contact-overview">
          <PageIntro
            heading="h2"
            eyebrow="CONTACT / MAKE A CONNECTION"
            title={s.contactHeading}
            description={s.contactIntro}
          />

          <p
            className="eyebrow"
            data-enter="label"
            style={{ animationDelay: "300ms" }}
          >
            OPEN A CHANNEL
          </p>
          {p.email && (
            <a className="contact-email" href={`mailto:${p.email}`}>
              {p.email} ↗
            </a>
          )}
          <p
            className="muted"
            data-enter="text"
            style={{ animationDelay: "350ms" }}
          >
            {p.availability}
          </p>
          <div
            className="social-list"
            data-enter="actions"
            style={{ animationDelay: "420ms" }}
          >
            {p.github && (
              <a href={p.github} rel="noreferrer" target="_blank">
                GitHub <span>↗</span>
              </a>
            )}
            {p.linkedin && (
              <a href={p.linkedin} rel="noreferrer" target="_blank">
                LinkedIn <span>↗</span>
              </a>
            )}
          </div>
          <p className="mono small">
            Thoughtful questions.
            <br />
            Meaningful conversations.
          </p>
        </aside>
        <ContactForm
          initialType={q.type === "freelance" ? "freelance" : "hiring"}
        />
      </div>
    </div>
  );
}
