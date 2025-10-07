import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface UnifiedCardProps {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export default function UnifiedCard({ to, title, description, icon }: UnifiedCardProps) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
