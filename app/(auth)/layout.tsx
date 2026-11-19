export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[420px]">
        <div className="rounded-[28px] border-2 border-line bg-surface p-6 sm:p-8 shadow-[0_4px_0_var(--line-strong)]">
          {children}
        </div>
      </div>
    </div>
  );
}
