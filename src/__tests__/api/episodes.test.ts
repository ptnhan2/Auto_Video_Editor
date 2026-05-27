import { describe, it, expect, vi, beforeEach } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Mock objects hoisted so vi.mock factory can reference them
// ═══════════════════════════════════════════════════════════════════
const mockStatement = {
  all: vi.fn(),
  get: vi.fn(),
  run: vi.fn(),
};

const mockDb = {
  prepare: vi.fn(() => mockStatement),
  exec: vi.fn(),
};

// Use function (not arrow) for constructor mock
vi.mock("node:sqlite", () => ({
  DatabaseSync: vi.fn(function () {
    return mockDb;
  }),
}));

// ═══════════════════════════════════════════════════════════════════
// Force fresh module import to reset the `db` singleton in getDb()
// ═══════════════════════════════════════════════════════════════════
let routeModule: {
  GET: () => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
};

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  // Re-apply the spy implementations after resetModules clears them
  mockDb.prepare = vi.fn(() => mockStatement);
  routeModule = await import("@/app/api/episodes/route");
});

// ─── GET /api/episodes ────────────────────────────────────────────
describe("GET /api/episodes", () => {
  it("returns episodes array on success", async () => {
    const mockEpisodes = [
      {
        id: "ep1",
        drama_id: "drama1",
        episode_number: 1,
        title: "Test Episode",
        content: "Some content",
        script_content: null,
        description: null,
        duration: 0,
        status: "draft",
        video_url: null,
        thumbnail: null,
        image_config_id: null,
        video_config_id: null,
        audio_config_id: null,
        created_at: "2026-05-27T00:00:00.000Z",
        updated_at: "2026-05-27T00:00:00.000Z",
      },
    ];

    mockStatement.all.mockReturnValue(mockEpisodes);

    const response = await routeModule.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ episodes: mockEpisodes });
  });

  it("returns empty array when no episodes exist", async () => {
    mockStatement.all.mockReturnValue([]);

    const response = await routeModule.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ episodes: [] });
  });

  it("returns 500 on database error", async () => {
    mockDb.prepare.mockImplementation(() => {
      throw new Error("SQLITE_CORRUPT");
    });

    const response = await routeModule.GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty("error");
  });
});

// ─── POST /api/episodes ───────────────────────────────────────────
describe("POST /api/episodes", () => {
  it("creates an episode and returns 201", async () => {
    const mockCreated = {
      id: "new_ep",
      drama_id: "drama1",
      episode_number: 1,
      title: "New Episode",
      content: "Hello world",
      script_content: null,
      description: null,
      duration: 0,
      status: "draft",
      video_url: null,
      thumbnail: null,
      image_config_id: null,
      video_config_id: null,
      audio_config_id: null,
      created_at: "2026-05-27T00:00:00.000Z",
      updated_at: "2026-05-27T00:00:00.000Z",
    };

    mockStatement.get.mockReturnValue(mockCreated);

    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drama_id: "drama1",
        episode_number: 1,
        title: "New Episode",
        content: "Hello world",
      }),
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ episode: mockCreated });
  });

  it("returns 400 when drama_id is missing", async () => {
    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episode_number: 1, title: "No Drama" }),
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when episode_number is zero", async () => {
    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drama_id: "drama1",
        episode_number: 0,
        title: "Invalid Number",
      }),
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when title is missing", async () => {
    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drama_id: "drama1", episode_number: 1 }),
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("returns 400 on invalid JSON body", async () => {
    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    });
    const response = await routeModule.POST(req);

    expect(response.status).toBe(400);
    // Invalid JSON returns plain NextResponse, not JSON body
  });

  it("returns 500 on database insert error", async () => {
    // Only make the FIRST prepare call throw (the INSERT)
    mockDb.prepare.mockImplementation(() => {
      throw new Error("SQLITE_CONSTRAINT");
    });

    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drama_id: "drama1",
        episode_number: 1,
        title: "Test",
      }),
    });
    const response = await routeModule.POST(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty("error");
  });
});
