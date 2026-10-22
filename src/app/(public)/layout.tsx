import { getProfile, getSettings } from "@/lib/content";
import { Header, Footer } from "@/components/shell";
import { PageEntrance } from "@/components/page-entrance";
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [p, s] = await Promise.all([getProfile(), getSettings()]);
  return (
    <>
      <Header />
      <main id="main">
        <PageEntrance>{children}</PageEntrance>
      </main>
      <Footer profile={p} settings={s} />
    </>
  );
}
