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
  GET: (req: Request) => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
};

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  // Re-apply the spy implementations after resetModules clears them
  mockDb.prepare = vi.fn(() => mockStatement);
  routeModule = await import("@/app/api/episodes/route");
});

// Helper: create a GET Request with optional query params
function createGetRequest(params?: Record<string, string>): Request {
  const url = new URL("http://localhost/api/episodes");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new Request(url.toString());
}

// ─── GET /api/episodes ────────────────────────────────────────────
describe("GET /api/episodes", () => {
  it("returns episodes array with pagination metadata", async () => {
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
    mockStatement.get.mockReturnValue({ count: 42 });

    const req = createGetRequest({ page: "2", limit: "10" });
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      episodes: mockEpisodes,
      pagination: { page: 2, limit: 10, total: 42, totalPages: 5 },
    });
  });

  it("uses default pagination when no params provided", async () => {
    mockStatement.all.mockReturnValue([]);
    mockStatement.get.mockReturnValue({ count: 0 });

    const req = createGetRequest();
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagination).toEqual({ page: 1, limit: 50, total: 0, totalPages: 0 });
  });

  it("clamps limit to max 100", async () => {
    mockStatement.all.mockReturnValue([]);
    mockStatement.get.mockReturnValue({ count: 0 });

    const req = createGetRequest({ limit: "999" });
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(body.pagination.limit).toBe(100);
  });

  it("returns 500 on database error (generic message)", async () => {
    mockDb.prepare.mockImplementation(() => {
      throw new Error("SQLITE_CORRUPT");
    });

    const req = createGetRequest();
    const response = await routeModule.GET(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Failed to fetch episodes");
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

  it("returns 400 when drama_id exceeds 36 chars", async () => {
    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drama_id: "x".repeat(37),
        episode_number: 1,
        title: "Test",
      }),
    });
    const response = await routeModule.POST(req);

    expect(response.status).toBe(400);
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

    expect(response.status).toBe(400);
  });

  it("returns 400 when title is missing", async () => {
    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drama_id: "drama1", episode_number: 1 }),
    });
    const response = await routeModule.POST(req);

    expect(response.status).toBe(400);
  });

  it("returns 400 when title exceeds 255 chars", async () => {
    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drama_id: "drama1",
        episode_number: 1,
        title: "x".repeat(256),
      }),
    });
    const response = await routeModule.POST(req);

    expect(response.status).toBe(400);
  });

  it("returns 400 on invalid JSON body", async () => {
    const req = new Request("http://localhost/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    });
    const response = await routeModule.POST(req);

    expect(response.status).toBe(400);
  });

  it("returns 500 on database insert error (generic message)", async () => {
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
    expect(body.error).toBe("Failed to create episode");
  });
});
