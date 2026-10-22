import { getProfile, getMedia } from "@/lib/content";
import { notFound, redirect } from "next/navigation";
export default async function Resume() {
  const p = await getProfile();
  if (!p.resumeId || !(await getMedia(p.resumeId))) notFound();
  redirect(`/media/${p.resumeId}`);
}
