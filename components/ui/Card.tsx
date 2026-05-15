interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface p-6 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
