import type { Metadata } from "next";
import { BoardView } from "@/components/tasks/board-view";

export const metadata: Metadata = {
  title: "Board · TaskFlow",
};

export default function BoardPage() {
  return <BoardView />;
}
