"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Folder, CaretRight, UploadSimple } from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  SearchField,
  Stickie,
  Button,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getSubjects } from "@/lib/queries";
import type { StudentProfile } from "@/types";

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function AssignmentsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) return;
      const data = await getUserData(user.id);
      if (!data || !active) return;
      setUserRole(data.role);

      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("uid", user.id)
          .single();
        if (!profile || !active) return;
        const p = profile as unknown as StudentProfile;
        const subs = await getSubjects(p.courseId, p.branchId, p.semesterId);
        if (active) setSubjects(subs);
      } else {
        const { data: allSubs } = await supabase
          .from("subjects")
          .select("id, name, code")
          .order("name", { ascending: true });
        if (active) setSubjects((allSubs || []) as Subject[]);
      }
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [subjects, search]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading subjects...
          </p>
        </div>
      </div>
    );
  }

  const canUpload = userRole === "admin" || userRole === "faculty";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title="Assignments"
        subtitle="Faculty course problem sets & guidelines"
        parentHref="/dashboard"
      />

      <div className="max-w-md">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Filter by subject or code..."
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="think" size={100} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              {search ? "No matching subjects" : "No assignments posted"}
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              {search
                ? `No subject matched "${search}".`
                : "Faculty will post problem sets and guidelines here."}
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
          {filteredSubjects.map((sub) => {
            return (
              <Link
                key={sub.id}
                href={`/dashboard/assignments/${encodeURIComponent(sub.id)}`}
                className="group p-4 rounded-[20px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] hover:border-tangerine active:shadow-[0_1px_0_var(--line-strong)] active:translate-y-[2px] transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center font-display font-black text-base shrink-0 bg-tangerine-tint text-tangerine-deep">
                    <Folder size={24} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-extrabold text-[15px] text-ink truncate group-hover:text-tangerine-deep transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-[11px] font-black uppercase text-ink-3 tracking-wider mt-0.5">
                      {sub.code}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-[10px] bg-surface-sunken flex items-center justify-center text-ink-3 group-hover:text-tangerine-deep group-hover:translate-x-0.5 transition-all shrink-0">
                  <CaretRight size={16} weight="bold" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
