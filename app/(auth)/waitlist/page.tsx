"use client";

import { Button } from "@/components/ui";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function WaitlistPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
        Pending Approval
      </h1>
      <p className="text-sm text-text-secondary max-w-xs">
        Your account is pending admin approval. We&apos;ll notify you when
        you&apos;re granted access.
      </p>
      <Button variant="ghost" onClick={handleLogout}>
        Sign out
      </Button>
    </div>
  );
}
