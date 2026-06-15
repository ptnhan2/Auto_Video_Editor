// ✏️ EDIT ZONE START
"use client";

import { use } from "react";
import { DramaDetail } from "@/ui/drama-detail";

export default function DramaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DramaDetail dramaId={id} />;
}
// ✏️ EDIT ZONE END
