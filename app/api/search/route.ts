import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_QUERY_LENGTH = 100;

/** Escape LIKE metacharacters so user input stays literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function mergeById<T extends { id: string }>(groups: T[][], limit: number): T[] {
  const seen = new Map<string, T>();
  for (const group of groups) {
    for (const row of group) {
      if (row?.id && !seen.has(row.id)) seen.set(row.id, row);
    }
  }
  return Array.from(seen.values()).slice(0, limit);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);
    if (verifyError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: caller } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("uid", user.id)
      .maybeSingle();
    if (!caller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);

    if (q.length < 2) {
      return NextResponse.json({ resources: [], subjects: [], announcements: [] });
    }

    const pattern = `%${escapeLike(q)}%`;

    const [resourcesByTitle, resourcesByDescription, subjectsByName, subjectsByCode, announcementsByTitle, announcementsByContent] =
      await Promise.all([
        supabaseAdmin
          .from("resources")
          .select("*")
          .ilike("title", pattern)
          .limit(10)
          .order("createdAt", { ascending: false }),
        supabaseAdmin
          .from("resources")
          .select("*")
          .ilike("description", pattern)
          .limit(10)
          .order("createdAt", { ascending: false }),
        supabaseAdmin
          .from("subjects")
          .select("id, name, code, courseId, semesterId")
          .ilike("name", pattern)
          .limit(10)
          .order("name", { ascending: true }),
        supabaseAdmin
          .from("subjects")
          .select("id, name, code, courseId, semesterId")
          .ilike("code", pattern)
          .limit(10)
          .order("name", { ascending: true }),
        supabaseAdmin
          .from("announcements")
          .select("*")
          .ilike("title", pattern)
          .limit(5)
          .order("createdAt", { ascending: false }),
        supabaseAdmin
          .from("announcements")
          .select("*")
          .ilike("content", pattern)
          .limit(5)
          .order("createdAt", { ascending: false }),
      ]);

    const resources = mergeById(
      [resourcesByTitle.data || [], resourcesByDescription.data || []],
      10
    );
    const subjects = mergeById(
      [subjectsByName.data || [], subjectsByCode.data || []],
      10
    );
    const announcements = mergeById(
      [announcementsByTitle.data || [], announcementsByContent.data || []],
      5
    );

    return NextResponse.json({ resources, subjects, announcements });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
