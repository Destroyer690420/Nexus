"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LargeTitleHeader,
  ScrollTabs,
  Stickie,
} from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import {
  OverviewTab,
  FacultyTab,
  CoursesTab,
  QueueTab,
  ResourcesTab,
  UsersTab,
} from "./components";

type Tab = "overview" | "faculty" | "courses" | "queue" | "resources" | "users";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "faculty", label: "Faculty Approvals" },
  { id: "courses", label: "Curriculum Catalog" },
  { id: "queue", label: "Contribution Queue" },
  { id: "resources", label: "Manage Resources" },
  { id: "users", label: "Campus Users" },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.id);
      if (!data || data.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      if (active) {
        setIsAdmin(true);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Verifying administrative access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title="Admin Panel"
        subtitle="Campus governance, user roles, curriculum catalog, and content verification"
        parentHref="/dashboard"
      />

      <ScrollTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as Tab)}
      />

      <div className="pt-2">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "faculty" && <FacultyTab />}
        {activeTab === "courses" && <CoursesTab />}
        {activeTab === "queue" && <QueueTab />}
        {activeTab === "resources" && <ResourcesTab />}
        {activeTab === "users" && <UsersTab />}
      </div>
    </div>
  );
}
