// ✏️ EDIT ZONE START
// Shared mappers — convert API snake_case rows → frontend camelCase types
// Used by landing-client, episode-detail, and drama-detail

import type { Episode, Drama } from "./types/episode";

/** Map API snake_case Episode row → camelCase Episode */
export function mapEpisodeRow(row: Record<string, unknown>, dramas: Drama[]): Episode {
  return {
    id: row.id as string,
    dramaId: (row.drama_id ?? "") as string,
    dramaTitle: dramas.find((d) => d.id === (row.drama_id as string))?.title,
    episodeNumber: (row.episode_number ?? 1) as number,
    title: (row.title ?? "") as string,
    content: (row.content ?? null) as string | null,
    scriptContent: (row.script_content ?? null) as string | null,
    description: (row.description ?? null) as string | null,
    duration: (row.duration ?? 0) as number,
    status: (row.status ?? "draft") as Episode["status"],
    videoUrl: (row.video_url ?? null) as string | null,
    thumbnail: (row.thumbnail ?? null) as string | null,
    createdAt: (row.created_at ?? "") as string,
    updatedAt: (row.updated_at ?? "") as string,
  };
}
// ✏️ EDIT ZONE END
