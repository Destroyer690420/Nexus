"use client";

import { useState, useEffect } from "react";
import { Button, Card } from "@/components/ui";
import { auth } from "@/lib/auth";
import { getIdToken } from "firebase/auth";
import { getPendingFaculty } from "@/lib/admin";
import type { UserData } from "@/types";

export function FacultyTab() {
  const [pending, setPending] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingUid, setApprovingUid] = useState<string | null>(null);

  useEffect(() => {
    getPendingFaculty()
      .then(setPending)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (uid: string, approved: boolean) => {
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
        body: JSON.stringify({ uid, approved }),
      });
      if (!res.ok) throw new Error("Failed");
      setPending((prev) => prev.filter((f) => f.uid !== uid));
    } catch {
      alert("Operation failed.");
    }
    setApprovingUid(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">
          {pending.length} faculty member{pending.length !== 1 ? "s" : ""}{" "}
          awaiting approval.
        </p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary">
            No pending faculty approvals.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((f) => (
            <Card
              key={f.uid}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {f.email}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Signed up {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => handleAction(f.uid, true)}
                  loading={approvingUid === f.uid}
                >
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleAction(f.uid, false)}
                  loading={approvingUid === f.uid}
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
