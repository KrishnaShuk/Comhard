import type { Metadata } from "next";
import { SectionsView } from "@/components/tasks/sections-view";

export const metadata: Metadata = {
  title: "Sections · TaskFlow",
};

export default function SectionsPage() {
  return <SectionsView />;
}
