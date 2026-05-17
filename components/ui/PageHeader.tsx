interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action, icon }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8 animate-fade-in">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 mt-0.5 h-10 w-10 rounded-[var(--radius-md)] bg-accent-light flex items-center justify-center text-accent">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
