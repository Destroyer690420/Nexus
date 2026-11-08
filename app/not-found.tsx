import Link from "next/link";
import { Stickie, Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <Stickie mood="oops" size={130} />
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-black text-ink">
            Lost on campus?
          </h1>
          <p className="text-sm font-medium text-ink-2 max-w-xs mx-auto">
            The page you are looking for has been moved or does not exist. Let&apos;s get you back to class.
          </p>
        </div>
        <div className="pt-2 w-full max-w-xs">
          <Link href="/dashboard" className="block w-full">
            <Button variant="primary" fullWidth size="lg">
              Back to campus
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

