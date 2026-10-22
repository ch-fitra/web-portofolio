import { readFile } from "node:fs/promises";
import path from "node:path";
import { currentOwner } from "@/lib/auth";
import { getMedia } from "@/lib/content";
import { uuid } from "@/lib/schema";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) return new Response(null, { status: 404 });
  const m = await getMedia(id, !!(await currentOwner()));
  if (!m) return new Response(null, { status: 404 });
  try {
    const data = await readFile(
      path.resolve(
        /* turbopackIgnore: true */ process.env.MEDIA_ROOT || "storage/media",
        m.filename,
      ),
    );
    return new Response(data, {
      headers: {
        "Content-Type": m.mime,
        "Content-Length": String(data.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(m.mime === "application/pdf"
          ? {
              "Content-Disposition": `attachment; filename="document-${id}.pdf"`,
              "Content-Security-Policy": "sandbox; default-src 'none'",
            }
          : {}),
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
