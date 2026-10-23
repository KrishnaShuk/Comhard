import type { Metadata } from "next";
import { ListView } from "@/components/tasks/list-view";

export const metadata: Metadata = {
  title: "List · TaskFlow",
};

export default function ListPage() {
  return <ListView />;
}
