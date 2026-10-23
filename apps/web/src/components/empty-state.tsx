import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <Inbox aria-hidden="true" className="h-5 w-5 text-muted" />
      <p className="mt-3 text-sm font-medium leading-5">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-5 text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
