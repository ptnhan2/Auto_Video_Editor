// ✏️ EDIT ZONE START
"use client";

import { use } from "react";
import { EpisodeDetail } from "@/ui/episode-detail";

export default function EpisodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EpisodeDetail episodeId={id} />;
}
// ✏️ EDIT ZONE END
