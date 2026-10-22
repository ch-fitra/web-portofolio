import { NextResponse, type NextRequest } from "next/server";
import pg from "pg";
// Check before React begins streaming so unpublished routes return a real HTTP 404.
// The page still performs its own RLS-protected read.
const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      connectionTimeoutMillis: 5000,
    })
  : null;
export async function proxy(request: NextRequest) {
  const slug = decodeURIComponent(request.nextUrl.pathname.split("/")[2] || "");
  const exists =
    pool &&
    (request.nextUrl.pathname === "/resume"
      ? (
          await pool.query(
            "SELECT 1 FROM media WHERE id::text=(SELECT data->>'resumeId' FROM documents WHERE key='profile') AND mime='application/pdf'",
          )
        ).rowCount
      : (
          await pool.query(
            "SELECT 1 FROM projects WHERE slug=$1 AND status='published'",
            [slug],
          )
        ).rowCount);
  if (!exists) {
    const response = NextResponse.rewrite(new URL("/404", request.url), {
      status: 404,
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  }
  return NextResponse.next();
}
export const config = { matcher: ["/projects/:slug", "/resume"] };
