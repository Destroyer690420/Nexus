"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function OnboardingPlaceholder() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
        Student Onboarding
      </h1>
      <p className="text-sm text-text-secondary max-w-xs">
        Course, branch, and semester selection will go here.
      </p>
      <Button variant="secondary" onClick={() => router.push("/auth")}>
        Back to auth
      </Button>
    </div>
  );
}
