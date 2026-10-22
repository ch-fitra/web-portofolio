import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/content";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    title: { default: s.title, template: `%s — ${s.title.split(" — ")[0]}` },
    description: s.description,
    openGraph: { type: "website", title: s.title, description: s.description },
    twitter: { card: "summary_large_image" },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSettings();
  const script = `try{var t=localStorage.getItem('theme')||${JSON.stringify(s.theme)};document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'):t;}catch(e){}`;
  return (
    <html
      data-scroll-behavior="smooth"
      lang={s.locale}
      data-theme={s.theme === "light" ? "light" : "dark"}
      data-motion="full"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
