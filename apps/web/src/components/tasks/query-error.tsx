import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { errorMessage } from "@/lib/tasks";

export function QueryError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <EmptyState
      title="Could not load tasks"
      description={errorMessage(error)}
      action={
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      }
    />
  );
}
