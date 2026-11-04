"use server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientKey, consumeLimit, cookieName, requireOwner } from "@/lib/auth";
import {
  hashToken,
  hashSessionToken,
  verifyAdminPassword,
} from "@/lib/password";
import {
  profileSchema,
  projectSchema,
  recordSchema,
  settingsSchema,
  uuid,
} from "@/lib/schema";
export type ActionResult = { ok: boolean; message: string; id?: string };
const failure = (message: string): ActionResult => ({ ok: false, message });
export async function login(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = z
    .object({ password: z.string().min(1).max(256) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return failure("Check your password.");
  try {
    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (!configuredPassword) throw Error("ADMIN_PASSWORD is required");
    const [ipAllowed, studioAllowed] = await Promise.all([
      consumeLimit(await clientKey("login"), 10, 900),
      consumeLimit(hashToken("login-studio"), 30, 900),
    ]);
    if (!ipAllowed || !studioAllowed)
      return failure("Too many attempts. Try again in 15 minutes.");
    if (!verifyAdminPassword(parsed.data.password, configuredPassword))
      return failure("Check your password.");
    const ownerId = "00000000-0000-4000-8000-000000000001";
    await db("auth").query(
      "INSERT INTO owners(id,email,password_hash) VALUES($1,'owner@portfolio.local','env-managed') ON CONFLICT(id) DO NOTHING",
      [ownerId],
    );
    const token = randomBytes(32).toString("hex");
    await db("auth").query("DELETE FROM sessions WHERE expires_at<now()");
    await db("auth").query(
      "INSERT INTO sessions(token_hash,owner_id,expires_at) VALUES($1,$2,now()+interval '12 hours')",
      [hashSessionToken(token, configuredPassword), ownerId],
    );
    (await cookies()).set(cookieName, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 43200,
    });
  } catch {
    return failure(
      "Sign-in is temporarily unavailable. Check the server configuration.",
    );
  }
  redirect("/admin");
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token && process.env.ADMIN_PASSWORD)
    await db("auth").query("DELETE FROM sessions WHERE token_hash=$1", [
      hashSessionToken(token, process.env.ADMIN_PASSWORD),
    ]);
  jar.delete(cookieName);
  redirect("/admin/login");
}
export async function saveDocument(
  key: "profile" | "settings",
  value: unknown,
): Promise<ActionResult> {
  await requireOwner();
  if (!["profile", "settings"].includes(key))
    return failure("Unsupported document.");
  const parsed = (key === "profile" ? profileSchema : settingsSchema).safeParse(
    value,
  );
  if (!parsed.success)
    return failure(
      parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  try {
    await db("owner").query(
      "INSERT INTO documents(key,data) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET data=$2,updated_at=now()",
      [key, JSON.stringify(parsed.data)],
    );
    revalidatePath("/", "layout");
    return { ok: true, message: "Changes saved." };
  } catch {
    return failure("Could not save. Please retry.");
  }
}
export async function saveProject(
  id: string | null,
  value: unknown,
): Promise<ActionResult> {
  await requireOwner();
  if (id && !uuid.safeParse(id).success) return failure("Invalid project.");
  const parsed = projectSchema.safeParse(value);
  if (!parsed.success)
    return failure(
      parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  const data = parsed.data;
  const client = await db("owner").connect();
  try {
    await client.query("BEGIN");
    let result;
    if (id) {
      await client.query(
        "INSERT INTO revisions(project_id,data) SELECT id,data FROM projects WHERE id=$1",
        [id],
      );
      result = await client.query(
        "UPDATE projects SET slug=$2,status=$3,data=$4,updated_at=now() WHERE id=$1 RETURNING id",
        [id, data.slug, data.status, JSON.stringify(data)],
      );
    } else
      result = await client.query(
        "INSERT INTO projects(slug,status,data) VALUES($1,$2,$3) RETURNING id",
        [data.slug, data.status, JSON.stringify(data)],
      );
    if (!result.rowCount) throw Error("Missing project");
    const projectId = result.rows[0].id;
    await client.query(
      "INSERT INTO audit_logs(action,entity_id) VALUES($1,$2)",
      [`project.save.${data.status}`, projectId],
    );
    await client.query("COMMIT");
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Project saved as ${data.status}.`,
      id: projectId,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    return failure(
      (e as { code?: string }).code === "23505"
        ? "This slug is already in use."
        : "Could not save the project. Please retry.",
    );
  } finally {
    client.release();
  }
}
export async function restoreRevision(
  projectId: string,
  revisionId: string,
): Promise<ActionResult> {
  await requireOwner();
  if (!uuid.safeParse(projectId).success || !uuid.safeParse(revisionId).success)
    return failure("Invalid revision.");
  const { rows } = await db("owner").query(
    "SELECT data FROM revisions WHERE id=$1 AND project_id=$2",
    [revisionId, projectId],
  );
  if (!rows[0]) return failure("Revision not found.");
  return saveProject(projectId, { ...rows[0].data, status: "draft" });
}
export async function saveRecord(
  kind: "skill" | "certification",
  id: string | null,
  value: unknown,
): Promise<ActionResult> {
  await requireOwner();
  if (
    !["skill", "certification"].includes(kind) ||
    (id && !uuid.safeParse(id).success)
  )
    return failure("Invalid item.");
  const p = recordSchema.safeParse(value);
  if (!p.success)
    return failure(
      p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
  try {
    if (id)
      await db("owner").query(
        "UPDATE records SET data=$1,visible=$2,updated_at=now() WHERE id=$3 AND kind=$4",
        [JSON.stringify(p.data), p.data.visible, id, kind],
      );
    else
      await db("owner").query(
        "INSERT INTO records(kind,data,visible) VALUES($1,$2,$3)",
        [kind, JSON.stringify(p.data), p.data.visible],
      );
    revalidatePath("/", "layout");
    return { ok: true, message: "Item saved." };
  } catch {
    return failure("Could not save the item.");
  }
}
export async function deleteRecord(id: string): Promise<ActionResult> {
  await requireOwner();
  if (!uuid.safeParse(id).success) return failure("Invalid item.");
  await db("owner").query("DELETE FROM records WHERE id=$1", [id]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Item deleted." };
}
