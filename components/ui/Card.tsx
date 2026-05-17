interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", onClick, interactive, style }: CardProps) {
  const isClickable = onClick || interactive;
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-all duration-200 ease-out ${
        isClickable
          ? "cursor-pointer hover:border-accent/40 hover:shadow-lg hover:shadow-accent-glow hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
          : "hover:shadow-sm"
      } ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

