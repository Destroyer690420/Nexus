export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-accent/3" />
      
      {/* Decorative orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-3xl pointer-events-none" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,110,247,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,110,247,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px] px-5 animate-slide-up">
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {children}
        </div>
      </div>
    </div>
  );
}
