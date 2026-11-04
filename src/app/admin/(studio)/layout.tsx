import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { logout } from "@/app/actions";
import { Preferences } from "@/components/preferences";
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const owner = await requireOwner();
  return (
    <div className="studio-layout">
      <aside className="studio-sidebar">
        <Link className="wordmark" href="/admin">
          cf
          <span className="tiny-dot" />{" "}
          <span className="mono">OWNER STUDIO</span>
        </Link>
        <nav aria-label="Studio navigation">
          {[
            ["", "Overview"],
            ["profile", "Profile & portraits"],
            ["projects", "Projects"],
            ["skills", "Skills"],
            ["certifications", "Certifications"],
            ["media", "Media library"],
            ["settings", "Site settings"],
          ].map(([path, label]) => (
            <Link key={path} href={`/admin${path ? `/${path}` : ""}`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank" className="text-link">
            View portfolio ↗
          </Link>
          <p className="small muted">{owner.email}</p>
          <Preferences />
          <form action={logout}>
            <button className="button button-outline">Sign out</button>
          </form>
        </div>
      </aside>
      <main id="main" className="studio-main">
        {children}
      </main>
    </div>
  );
}
