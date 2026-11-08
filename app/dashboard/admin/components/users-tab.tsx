"use client";

import { useState, useEffect, useMemo } from "react";
import { Check } from "@phosphor-icons/react";
import {
  Button,
  Chip,
  SearchField,
  Select,
  Stickie,
  Avatar,
} from "@/components/ui";
import { getAllUsers, updateUserRole } from "@/lib/queries";
import { getSessionToken } from "@/lib/supabase-auth";
import type { UserData, UserRole } from "@/types";

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
      const token = await getSessionToken();
      if (!token) return;
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

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q))
    );
  }, [users, search]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Stickie mood="think" size={80} />
        <p className="font-display font-extrabold text-sm text-ink-3">
          Loading campus users...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
        />
      </div>

      <div className="space-y-3">
        {filtered.map((u) => {
          const roleVariant: "berry" | "tangerine" | "neutral" =
            u.role === "admin"
              ? "berry"
              : u.role === "faculty"
              ? "tangerine"
              : "neutral";

          return (
            <div
              key={u.uid}
              className="p-4 rounded-[20px] border-2 border-line bg-surface shadow-[0_2px_0_var(--line-strong)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  name={u.name || u.email}
                  src={u.avatarUrl}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-display font-extrabold text-sm text-ink truncate">
                      {u.name || u.email.split("@")[0]}
                    </h4>
                    <Chip variant={roleVariant} className="text-[10px] uppercase font-black">
                      {u.role}
                    </Chip>
                    {u.role === "faculty" && !u.approved && (
                      <Chip variant="sun" className="text-[10px] font-bold">
                        Pending
                      </Chip>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-ink-3 truncate">
                    {u.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                {u.role === "faculty" && !u.approved && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleFacultyApprove(u.uid)}
                    loading={approvingUid === u.uid}
                  >
                    <Check size={14} weight="bold" />
                    Approve
                  </Button>
                )}

                <div className="w-36">
                  <Select
                    value={u.role}
                    onChange={(e) =>
                      handleRoleChange(u.uid, e.target.value as UserRole)
                    }
                    disabled={changingRole === u.uid}
                    options={[
                      { value: "student", label: "Student" },
                      { value: "faculty", label: "Faculty" },
                      { value: "admin", label: "Admin" },
                    ]}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
