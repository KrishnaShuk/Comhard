export const queryKeys = {
  me: ["auth", "me"] as const,
  authStatus: ["auth", "status"] as const,
  tasks: (search: string) => ["tasks", search] as const,
  task: (id: string) => ["task", id] as const,
  compliance: (search: string) => ["compliance", search] as const,
};
