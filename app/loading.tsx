import { Stickie } from "@/components/ui";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <Stickie mood="think" size={100} />
        <p className="font-display font-extrabold text-sm text-ink-2">
          Loading Nexus...
        </p>
      </div>
    </div>
  );
}
