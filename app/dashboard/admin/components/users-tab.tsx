"use client";

import { useState, useEffect } from "react";
import { Button, Card, Input } from "@/components/ui";
import { getAllUsers, updateUserRole } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { getIdToken } from "firebase/auth";
import type { UserData, UserRole } from "@/types";

const roleColors: Record<UserRole, string> = {
  admin: "bg-accent-light text-accent",
  faculty: "bg-warning/10 text-warning",
  student: "bg-success/10 text-success",
};

export function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [approvingUid, setApprovingUid] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const list = await getAllUsers();
    setUsers(list);
    setLoading(false);
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    setChangingRole(uid);
    try {
      await updateUserRole(uid, role);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role } : u))
      );
    } catch {
      alert("Failed to update role.");
    }
    setChangingRole(null);
  };

  const handleFacultyApprove = async (uid: string) => {
    setApprovingUid(uid);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await getIdToken(user);
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, approved: true }),
      });
      if (!res.ok) throw new Error("Failed");
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, approved: true } : u))
      );
    } catch {
      alert("Failed to approve faculty.");
    }
    setApprovingUid(null);
  };

  const filtered = users.filter(
    (u) =>
      !search || u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="text-sm text-text-secondary mb-4">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""}.
      </p>

      <div className="flex flex-col gap-2">
        {filtered.map((u) => (
          <Card key={u.uid} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {u.email}
                </p>
                <p className="text-xs text-text-tertiary">
                  Joined {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  roleColors[u.role]
                }`}
              >
                {u.role}
              </span>
              {u.role === "faculty" && (
                <span
                  className={`text-xs ${
                    u.approved
                      ? "text-success"
                      : "text-warning"
                  }`}
                >
                  {u.approved ? "Approved" : "Pending"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={u.role}
                onChange={(e) =>
                  handleRoleChange(u.uid, e.target.value as UserRole)
                }
                disabled={changingRole === u.uid}
                className="rounded border border-border bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              {u.role === "faculty" && !u.approved && (
                <Button
                  variant="primary"
                  onClick={() => handleFacultyApprove(u.uid)}
                  loading={approvingUid === u.uid}
                >
                  Approve
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
