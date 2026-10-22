import { NextResponse } from "next/server";
import { currentOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { uuid } from "@/lib/schema";
import { getMedia } from "@/lib/content";
import { unlink } from "node:fs/promises";
import path from "node:path";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await currentOwner()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (
    request.headers.get("origin") !==
    new URL(process.env.SITE_URL || request.url).origin
  )
    return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  const { id } = await params;
  if (!uuid.safeParse(id).success) return new Response(null, { status: 404 });
  const body = await request.json();
  if (typeof body.alt !== "string" || !body.alt.trim() || body.alt.length > 300)
    return NextResponse.json({ message: "Alt text required" }, { status: 400 });
  await db("owner").query("UPDATE media SET alt=$2 WHERE id=$1", [
    id,
    body.alt.trim(),
  ]);
  return NextResponse.json({ message: "Alt text updated." });
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await currentOwner()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (
    request.headers.get("origin") !==
    new URL(process.env.SITE_URL || request.url).origin
  )
    return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  const { id } = await params;
  if (!uuid.safeParse(id).success) return new Response(null, { status: 404 });
  const pattern = `%${id}%`;
  const { rows } = await db("owner").query(
    "SELECT 1 FROM documents WHERE data::text LIKE $1 UNION ALL SELECT 1 FROM projects WHERE data::text LIKE $1 UNION ALL SELECT 1 FROM records WHERE data::text LIKE $1 UNION ALL SELECT 1 FROM revisions WHERE data::text LIKE $1 LIMIT 1",
    [pattern],
  );
  if (rows.length)
    return NextResponse.json(
      {
        message:
          "This asset is referenced by content or a saved revision. Remove those references first.",
      },
      { status: 409 },
    );
  const m = await getMedia(id, true);
  if (!m) return new Response(null, { status: 404 });
  await db("owner").query("DELETE FROM media WHERE id=$1", [id]);
  await unlink(
    path.resolve(
      /* turbopackIgnore: true */ process.env.MEDIA_ROOT || "storage/media",
      m.filename,
    ),
  ).catch(() => {});
  return NextResponse.json({ message: "Asset deleted." });
}
