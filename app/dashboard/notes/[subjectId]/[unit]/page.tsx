"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  FileCard,
  Stickie,
  Button,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getResourcesBySubject } from "@/lib/queries";
import type { StudentProfile, Resource } from "@/types";

export default function NotesUnitPage() {
  const params = useParams();
  const subjectId = decodeURIComponent(params.subjectId as string);
  const unit = Number(params.unit);
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) return;
      const data = await getUserData(user.id);
      if (!data || !active) return;

      // Get subject name
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", subjectId)
        .single();
      if (subjectData && active) setSubjectName(subjectData.name as string);

      let allResources: Resource[] = [];
      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("uid", user.id)
          .single();
        if (!profile || !active) return;
        const p = profile as unknown as StudentProfile;
        allResources = await getResourcesBySubject(
          "notes",
          p.courseId,
          p.branchId,
          p.semesterId,
          subjectId
        );
      } else {
        const { data: res } = await supabase
          .from("resources")
          .select("*")
          .eq("type", "notes")
          .eq("subjectId", subjectId)
          .order("createdAt", { ascending: false });
        allResources = (res || []) as unknown as Resource[];
      }

      // Filter by unit
      const filtered = allResources.filter((r) => {
        if (unit === 0) return !r.unit;
        return r.unit === unit;
      });
      if (active) setResources(filtered);
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [subjectId, unit]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading unit notes...
          </p>
        </div>
      </div>
    );
  }

  const unitLabel = unit === 0 ? "General & Syllabus" : `Unit ${unit}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title={unitLabel}
        subtitle={`${subjectName || "Subject"} • ${resources.length} document${
          resources.length !== 1 ? "s" : ""
        }`}
        parentHref={`/dashboard/notes/${encodeURIComponent(subjectId)}`}
      />

      {resources.length === 0 ? (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="think" size={110} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              No notes for this unit yet
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              Be the first to share notes or lecture slides for {unitLabel}.
            </p>
          </div>
          <Link href="/dashboard/contribute">
            <Button variant="primary" size="md">
              <PlusCircle size={18} weight="bold" />
              Contribute the first note
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {resources.map((res) => (
            <FileCard
              key={res.id}
              id={res.id}
              title={res.title}
              fileRef={res.fileId || res.fileUrl || ""}
              description={res.description}
              unit={res.unit}
              year={res.year}
              tags={res.tags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
