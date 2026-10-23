"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "font-sans !rounded-lg !border !border-border !bg-surface !text-foreground !shadow-float",
          description: "!text-muted",
          actionButton: "!bg-accent !text-white",
          cancelButton: "!bg-surface !text-foreground",
          closeButton: "!border-border !bg-surface !text-muted",
        },
      }}
    />
  );
}
