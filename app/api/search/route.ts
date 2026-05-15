import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ resources: [], assignments: [], subjects: [], announcements: [] });
    }

    const query = `%${q.trim()}%`;

    const [resourcesRes, assignmentsRes, subjectsRes, announcementsRes] = await Promise.all([
      supabaseAdmin
        .from("resources")
        .select("*")
        .or(`title.ilike.${query},description.ilike.${query}`)
        .limit(10)
        .order("createdAt", { ascending: false }),
      supabaseAdmin
        .from("assignments")
        .select("*")
        .or(`title.ilike.${query},description.ilike.${query}`)
        .limit(10)
        .order("createdAt", { ascending: false }),
      supabaseAdmin
        .from("subjects")
        .select("id, name, code, courseId, semesterId")
        .or(`name.ilike.${query},code.ilike.${query}`)
        .limit(10)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("announcements")
        .select("*")
        .or(`title.ilike.${query},content.ilike.${query}`)
        .limit(5)
        .order("createdAt", { ascending: false }),
    ]);

    return NextResponse.json({
      resources: resourcesRes.data || [],
      assignments: assignmentsRes.data || [],
      subjects: subjectsRes.data || [],
      announcements: announcementsRes.data || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
