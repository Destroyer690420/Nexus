import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton variant="text" width="60%" height="2rem" />
        <Skeleton variant="text" width="40%" height="1rem" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Skeleton variant="card" height="110px" />
        <Skeleton variant="card" height="110px" />
        <Skeleton variant="card" height="110px" />
        <Skeleton variant="card" height="110px" />
      </div>

      <div className="space-y-3 pt-2">
        <Skeleton variant="text" width="30%" height="1.25rem" />
        <div className="rounded-[20px] border-2 border-line bg-surface p-4 space-y-3">
          <Skeleton variant="rectangular" height="52px" />
          <Skeleton variant="rectangular" height="52px" />
          <Skeleton variant="rectangular" height="52px" />
        </div>
      </div>
    </div>
  );
}
