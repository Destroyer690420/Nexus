"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";
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

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "faculty", label: "Faculty" },
  { id: "courses", label: "Courses" },
  { id: "queue", label: "Content Queue" },
  { id: "resources", label: "Resources" },
  { id: "users", label: "Users" },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || data.role !== "admin") { router.replace("/dashboard"); return; }
      setIsAdmin(true);
      setLoading(false);
    });
    return unsub;
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return <p className="text-sm text-text-secondary">Redirecting...</p>;
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Admin Panel"
        subtitle="Manage courses, users, content, and more."
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>}
      />

      {/* Pill-style tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto rounded-[var(--radius-lg)] bg-surface-hover p-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium rounded-[var(--radius-md)] transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
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
