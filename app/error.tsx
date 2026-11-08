"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Stickie, Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <Stickie mood="oops" size={130} />
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-black text-ink">
            Something stumbled
          </h1>
          <p className="text-sm font-medium text-ink-2 max-w-xs mx-auto">
            An unexpected hiccup occurred. Don&apos;t worry, your files and notes are safe.
          </p>
        </div>
        <div className="pt-2 w-full max-w-xs flex flex-col gap-2.5">
          <Button variant="primary" fullWidth size="lg" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/dashboard" className="block w-full">
            <Button variant="secondary" fullWidth size="md">
              Return to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

