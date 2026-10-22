import { redirect } from "next/navigation";
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  redirect(type === "freelance" ? "/?type=freelance#contact" : "/#contact");
}
