import type { Metadata } from "next";
import { ComplianceView } from "@/components/insights/compliance-view";

export const metadata: Metadata = {
  title: "Insights · TaskFlow",
};

export default function InsightsPage() {
  return <ComplianceView />;
}
