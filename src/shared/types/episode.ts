// ✏️ EDIT ZONE START
// Types for Drama & Episode — shared across /api, /ui, and tests
// Mirrors src/db/schema.py: Drama + Episode models

export type DramaStatus = "draft" | "in_progress" | "completed";

export type EpisodeStatus =
  | "draft"
  | "pending"
  | "scripting"
  | "rendering"
  | "completed"
  | "needs_review"
  | "failed";

export interface Drama {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  style: string;
  totalEpisodes: number;
  totalDuration: number;
  status: DramaStatus;
  thumbnail: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: string;
  dramaId: string;
  dramaTitle?: string;
  episodeNumber: number;
  title: string;
  content: string | null;
  scriptContent: string | null;
  description: string | null;
  duration: number;
  status: EpisodeStatus;
  videoUrl: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeListResponse {
  episodes: Episode[];
  dramas: Drama[];
}

// ✏️ EDIT ZONE END
