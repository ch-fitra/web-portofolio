import Link from "next/link";
import { ArrowDownToLine } from "lucide-react";
import { getProfile, getSettings } from "@/lib/content";
import { Portrait } from "@/components/portrait";
import styles from "./about.module.css";

export default async function About() {
  const [p, s] = await Promise.all([getProfile(), getSettings()]);
  const id = s.locale === "id";
  const about = id && p.aboutId ? p.aboutId : p.about;
  const details = [
    { label: id ? "Nama" : "Name", value: p.name },
    { label: id ? "Bidang" : "Focus", value: p.role },
    { label: id ? "Domisili" : "Based in", value: p.location },
    {
      label: id ? "Pendidikan" : "Education",
      value: p.university,
    },
  ].filter((detail) => detail.value.trim());

  return (
    <div className={`container about-profile-page ${styles.page}`}>
      <header className={styles.heading}>
        <h2 data-enter="text" style={{ animationDelay: "80ms" }}>
          {id ? "Tentang saya" : "About me"}
          <span>.</span>
        </h2>
      </header>

      <div className={styles.layout}>
        <div className={styles.photo}>
          <Portrait
            id={p.aboutPortraitId}
            position={p.aboutPosition}
            variant="about"
          />
        </div>

        <div className={styles.content}>
          <div className={styles.stories}>
            <section
              className={styles.story}
              data-enter="text"
              style={{ animationDelay: "200ms" }}
            >
              <h3>{id ? "Siapa saya" : "Who I am"}</h3>
              <p>{about}</p>
            </section>
          </div>

          <section
            className={styles.details}
            data-enter="panel"
            style={{ animationDelay: "340ms" }}
          >
            <h3>{id ? "Profil singkat" : "Personal details"}</h3>
            <dl>
              {details.map((detail) => (
                <div key={detail.label}>
                  <dt>{detail.label}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {p.resumeId && (
            <div
              className={styles.actions}
              data-enter="actions"
              style={{ animationDelay: "410ms" }}
            >
              <Link href="/resume" className="text-link">
                {id ? "Unduh CV" : "Download résumé"}
                <ArrowDownToLine size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
