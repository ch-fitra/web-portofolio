import "server-only";
import { db } from "./db";
import {
  defaultProfile,
  defaultSettings,
  type Project,
  type Profile,
  type Settings,
  type ContentRecord,
} from "./schema";
export async function document<T>(key: string, fallback: T): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback;
  const { rows } = await db().query("SELECT data FROM documents WHERE key=$1", [
    key,
  ]);
  return rows[0]?.data ?? fallback;
}
export const getProfile = async (): Promise<Profile> => ({
  ...defaultProfile,
  ...(await document<Partial<Profile>>("profile", defaultProfile)),
});
export const getSettings = () =>
  document<Settings>("settings", defaultSettings);
export async function getProjects(owner = false): Promise<Project[]> {
  if (!process.env.DATABASE_URL) return [];
  const { rows } = await db(owner ? "owner" : "public").query(
    "SELECT id,data,updated_at FROM projects ORDER BY (data->>'order')::int, updated_at DESC",
  );
  return rows.map((r) => ({
    ...r.data,
    id: r.id,
    updated_at: r.updated_at.toISOString(),
  }));
}
export async function getProject(slug: string, owner = false) {
  if (!process.env.DATABASE_URL) return null;
  const { rows } = await db(owner ? "owner" : "public").query(
    "SELECT id,data,updated_at FROM projects WHERE slug=$1",
    [slug],
  );
  return rows[0]
    ? ({
        ...rows[0].data,
        id: rows[0].id,
        updated_at: rows[0].updated_at.toISOString(),
      } as Project)
    : null;
}
export async function getRecords(
  kind: "skill" | "certification",
  owner = false,
): Promise<ContentRecord[]> {
  if (!process.env.DATABASE_URL) return [];
  const { rows } = await db(owner ? "owner" : "public").query(
    "SELECT id,kind,data FROM records WHERE kind=$1 ORDER BY (data->>'order')::int",
    [kind],
  );
  return rows.map((r) => ({ ...r.data, id: r.id, kind: r.kind }));
}
export type Media = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  alt: string;
};
export async function getMedia(
  id: string,
  owner = false,
): Promise<Media | null> {
  if (!id || !process.env.DATABASE_URL) return null;
  const { rows } = await db(owner ? "owner" : "public").query(
    "SELECT * FROM media WHERE id=$1",
    [id],
  );
  return rows[0] ?? null;
}
