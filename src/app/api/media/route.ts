import { NextResponse } from "next/server";
import { currentOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { prepareUpload } from "@/lib/upload";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
export async function POST(request: Request) {
  if (!(await currentOwner()))
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin !== new URL(process.env.SITE_URL || request.url).origin)
    return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 11 * 1024 * 1024)
    return NextResponse.json({ message: "File too large" }, { status: 413 });
  let storedPath: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") || "").trim();
    if (
      !(file instanceof File) ||
      !alt ||
      alt.length > 300 ||
      file.size > 10 * 1024 * 1024
    )
      return NextResponse.json(
        {
          message:
            "Choose a file under 10 MB and provide descriptive alt text.",
        },
        { status: 400 },
      );
    const asset = await prepareUpload(
      Buffer.from(await file.arrayBuffer()),
      path.extname(file.name),
    );
    const id = randomUUID();
    const filename = `${id}${asset.ext}`;
    const root = path.resolve(
      /* turbopackIgnore: true */ process.env.MEDIA_ROOT || "storage/media",
    );
    await mkdir(root, { recursive: true });
    storedPath = path.join(/* turbopackIgnore: true */ root, filename);
    await writeFile(storedPath, asset.buffer, { flag: "wx" });
    const client = await db("owner").connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO media(id,filename,mime,size,width,height,alt) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          id,
          filename,
          asset.mime,
          asset.buffer.length,
          asset.width,
          asset.height,
          alt,
        ],
      );
      await client.query(
        "INSERT INTO audit_logs(action,entity_id) VALUES($1,$2)",
        ["media.upload", id],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return NextResponse.json({
      id,
      message:
        "Uploaded. Media remains private until referenced by published content.",
    });
  } catch (e) {
    if (storedPath) await unlink(storedPath).catch(() => {});
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Upload failed." },
      { status: 400 },
    );
  }
}
