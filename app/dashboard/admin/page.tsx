"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Button, Card } from "@/components/ui";
import { auth, db, onAuthChange, getUserData } from "@/lib/auth";
import { getIdToken } from "firebase/auth";
import type { UserData } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingFaculty, setPendingFaculty] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [approvingUid, setApprovingUid] = useState<string | null>(null);

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
      fetchPendingFaculty();
      setLoading(false);
    });
    return unsub;
  }, [router]);

  const fetchPendingFaculty = useCallback(async () => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "faculty"),
      where("approved", "==", false)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as UserData);
    setPendingFaculty(list);
  }, []);

  const handleApprove = async (uid: string) => {
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

      if (!res.ok) throw new Error("Failed to approve");

      setPendingFaculty((prev) => prev.filter((f) => f.uid !== uid));
    } catch {
      alert("Failed to approve faculty member.");
    }
    setApprovingUid(null);
  };

  const handleReject = async (uid: string) => {
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
        body: JSON.stringify({ uid, approved: false }),
      });

      if (!res.ok) throw new Error("Failed to reject");

      setPendingFaculty((prev) => prev.filter((f) => f.uid !== uid));
    } catch {
      alert("Failed to reject faculty member.");
    }
    setApprovingUid(null);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMessage("");
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setSeedMessage(`Error: ${data.error}`);
      } else {
        setSeedMessage(
          `Database seeded! Admin: ${data.adminEmail} / ${data.adminPassword}`
        );
      }
    } catch {
      setSeedMessage("Seed request failed. Is the service account set up?");
    }
    setSeeding(false);
  };

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
    <div className="max-w-3xl flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage faculty accounts and seed the database.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-text-primary">
            Pending Faculty Approvals
          </h2>
          <span className="text-xs text-text-tertiary">
            {pendingFaculty.length} pending
          </span>
        </div>

        {pendingFaculty.length === 0 ? (
          <Card>
            <p className="text-sm text-text-secondary">
              No pending faculty approvals.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingFaculty.map((f) => (
              <Card key={f.uid} className="flex items-center justify-between p-4">
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
                    onClick={() => handleApprove(f.uid)}
                    loading={approvingUid === f.uid}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleReject(f.uid)}
                    loading={approvingUid === f.uid}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-medium text-text-primary mb-4">
          Database
        </h2>
        <Card className="p-4">
          <p className="text-sm text-text-secondary mb-3">
            Seed the database with sample courses, branches, and an admin
            account. Requires a Firebase service account key.
          </p>
          <Button onClick={handleSeed} loading={seeding} variant="secondary">
            Seed Database
          </Button>
          {seedMessage && (
            <p className="mt-2 text-sm text-text-secondary">{seedMessage}</p>
          )}
        </Card>
      </section>
    </div>
  );
}
