import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AppShell } from "@/components/app-shell";
import { TaskFiltersProvider } from "@/components/tasks/task-filters-context";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <TaskFiltersProvider>
        <AppShell>{children}</AppShell>
      </TaskFiltersProvider>
    </AuthGate>
  );
}
