"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { UploadSimple } from "@phosphor-icons/react";
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

export default function AssignmentsSubjectPage() {
  const params = useParams();
  const subjectId = decodeURIComponent(params.subjectId as string);
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) return;
      const data = await getUserData(user.id);
      if (!data || !active) return;
      setUserRole(data.role);

      const { data: subjectData } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", subjectId)
        .single();
      if (subjectData && active) setSubjectName(subjectData.name as string);

      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("uid", user.id)
          .single();
        if (!profile || !active) return;
        const p = profile as unknown as StudentProfile;
        const res = await getResourcesBySubject(
          "assignments",
          p.courseId,
          p.branchId,
          p.semesterId,
          subjectId
        );
        if (active) setResources(res);
      } else {
        const { data: res } = await supabase
          .from("resources")
          .select("*")
          .eq("type", "assignments")
          .eq("subjectId", subjectId)
          .order("createdAt", { ascending: false });
        if (active) setResources((res || []) as unknown as Resource[]);
      }
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [subjectId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading assignment materials...
          </p>
        </div>
      </div>
    );
  }

  const canUpload = userRole === "admin" || userRole === "faculty";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title={subjectName || "Subject Assignments"}
        subtitle={`${resources.length} assignment document${
          resources.length !== 1 ? "s" : ""
        } posted`}
        parentHref="/dashboard/assignments"
      />

      {resources.length === 0 ? (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="think" size={110} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              No assignments posted yet
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              Faculty members have not posted problem sheets or guidelines for this subject yet.
            </p>
          </div>
          {canUpload && (
            <Link href="/dashboard/upload">
              <Button variant="primary" size="md">
                <UploadSimple size={18} weight="bold" />
                Upload assignment material
              </Button>
            </Link>
          )}
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
