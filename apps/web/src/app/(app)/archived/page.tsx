import type { Metadata } from "next";
import { ArchivedView } from "@/components/tasks/archived-view";

export const metadata: Metadata = {
  title: "Archived · TaskFlow",
};

export default function ArchivedPage() {
  return <ArchivedView />;
}
