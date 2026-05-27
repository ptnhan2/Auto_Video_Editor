// ✏️ EDIT ZONE START (lines 1-48)
import type { Metadata } from "next";
import { LandingClient } from "@/ui/landing-client";

export const metadata: Metadata = {
  title: "Auto Video Editor",
  description: "Manage AI-generated dramas and episodes from a single dashboard.",
};

export default function Home() {
  return <LandingClient />;
}
// ✏️ EDIT ZONE END (lines 1-48)
