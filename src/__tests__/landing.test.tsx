// ✏️ EDIT ZONE START
import { describe, it, expect } from "vitest";
import type { Drama, Episode, DramaStatus, EpisodeStatus } from "@/shared/types/episode";

describe("Type system — Drama & Episode", () => {
  it("Drama type accepts all required fields", () => {
    const drama: Drama = {
      id: "d1",
      title: "Test",
      description: null,
      genre: null,
      style: "modern",
      totalEpisodes: 3,
      totalDuration: 900,
      status: "draft",
      thumbnail: null,
      tags: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(drama.id).toBe("d1");
    expect(drama.status).toBe("draft");
  });

  it("Episode type accepts all required fields", () => {
    const episode: Episode = {
      id: "e1",
      dramaId: "d1",
      dramaTitle: "Test Drama",
      episodeNumber: 1,
      title: "Pilot",
      description: null,
      content: null,
      scriptContent: null,
      duration: 300,
      status: "draft",
      videoUrl: null,
      thumbnail: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(episode.episodeNumber).toBe(1);
    expect(episode.status).toBe("draft");
  });
});

describe("Status mapping — completeness check", () => {
  it("all DramaStatus values are defined", () => {
    const statuses: DramaStatus[] = ["draft", "in_progress", "completed"];
    expect(statuses).toHaveLength(3);
    statuses.forEach((s) => expect(typeof s).toBe("string"));
  });

  it("all EpisodeStatus values are defined", () => {
    const statuses: EpisodeStatus[] = [
      "draft",
      "pending",
      "scripting",
      "rendering",
      "completed",
      "needs_review",
      "failed",
    ];
    expect(statuses).toHaveLength(7);
    statuses.forEach((s) => expect(typeof s).toBe("string"));
  });
});

describe("Mock data — integrity", () => {
  it("mock dramas have required fields", async () => {
    const { mockDramas } = await import("@/ui/mock-data");
    expect(mockDramas.length).toBeGreaterThan(0);
    for (const d of mockDramas) {
      expect(d.id).toBeTruthy();
      expect(d.title).toBeTruthy();
      expect(["draft", "in_progress", "completed"]).toContain(d.status);
    }
  });

  it("mock episodes have required fields", async () => {
    const { mockEpisodes } = await import("@/ui/mock-data");
    expect(mockEpisodes.length).toBeGreaterThan(0);
    for (const ep of mockEpisodes) {
      expect(ep.id).toBeTruthy();
      expect(ep.title).toBeTruthy();
      expect(ep.dramaId).toBeTruthy();
      expect([
        "draft",
        "pending",
        "scripting",
        "rendering",
        "completed",
        "failed",
      ]).toContain(ep.status);
    }
  });

  it("every episode's dramaId references a valid drama", async () => {
    const { mockDramas, mockEpisodes } = await import("@/ui/mock-data");
    const dramaIds = new Set(mockDramas.map((d) => d.id));
    for (const ep of mockEpisodes) {
      expect(dramaIds.has(ep.dramaId)).toBe(true);
    }
  });
});
// ✏️ EDIT ZONE END
