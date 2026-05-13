"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange, getUserData } from "@/lib/auth";
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
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.uid);
      if (!data || data.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage courses, users, content, and more.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 ease-out cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "faculty" && <FacultyTab />}
      {activeTab === "courses" && <CoursesTab />}
      {activeTab === "queue" && <QueueTab />}
      {activeTab === "resources" && <ResourcesTab />}
      {activeTab === "users" && <UsersTab />}
    </div>
  );
}
