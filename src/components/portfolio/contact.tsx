import { ArrowUpRight } from "lucide-react";
import { SocialIcon } from "@/components/social-icons";
import { getProfile, getSettings } from "@/lib/content";
import { PageIntro } from "@/components/shell";

export default async function Contact() {
  const [p, s] = await Promise.all([getProfile(), getSettings()]);
  const indonesian = s.locale === "id";
  const channels = [
    {
      name: "LinkedIn",
      href: p.linkedin,
      kind: "linkedin" as const,
      description: indonesian
        ? "Terhubung dan diskusikan peluang kerja."
        : "Connect and talk about opportunities.",
    },
    {
      name: "GitHub",
      href: p.github,
      kind: "github" as const,
      description: indonesian
        ? "Lihat kode, kontribusi, dan proyek saya."
        : "Explore my code, contributions, and projects.",
    },
    {
      name: "Instagram",
      href: p.instagram,
      kind: "instagram" as const,
      description: indonesian
        ? "Ikuti cerita dan keseharian saya."
        : "Follow along beyond the code.",
    },
    {
      name: "Email",
      href: p.email ? `mailto:${p.email}` : "",
      kind: "email" as const,
      description: p.email,
    },
  ].filter((channel) => channel.href);
  return (
    <div className="container contact-page">
      <div className="contact-layout contact-direct-layout">
        <aside className="contact-overview">
          <PageIntro
            heading="h2"
            eyebrow="CONTACT / FIND ME ONLINE"
            title={s.contactHeading}
            description={s.contactIntro}
          />
          <p
            className="muted"
            data-enter="text"
            style={{ animationDelay: "300ms" }}
          >
            {indonesian
              ? "Hubungi saya langsung melalui media sosial atau email."
              : "Reach me directly through social media or email."}
          </p>
        </aside>
        <div
          className="contact-channels"
          data-enter="panel"
          style={{ animationDelay: "220ms" }}
        >
          <p className="eyebrow">
            {indonesian ? "TEMUKAN SAYA DI" : "ELSEWHERE ON THE WEB"}
          </p>
          {channels.map(({ name, href, kind, description }) => (
            <a
              className="contact-channel"
              key={name}
              href={href}
              target={kind === "email" ? undefined : "_blank"}
              rel={kind === "email" ? undefined : "noopener noreferrer"}
            >
              <SocialIcon kind={kind} />
              <span>
                <strong>{name}</strong>
                <small>{description}</small>
              </span>
              <ArrowUpRight size={22} aria-hidden="true" />
            </a>
          ))}
          {!channels.length && (
            <p className="muted">
              {indonesian
                ? "Tautan media sosial akan segera tersedia."
                : "Social profiles will be available soon."}
            </p>
          )}
          <p className="mono small muted">
            {indonesian
              ? "KONEKSI LANGSUNG. PERCAKAPAN BERMAKNA."
              : "DIRECT CONNECTIONS. MEANINGFUL CONVERSATIONS."}
          </p>
        </div>
      </div>
    </div>
  );
}
