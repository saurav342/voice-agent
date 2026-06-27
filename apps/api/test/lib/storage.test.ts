import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uploadRecordingToSupabase } from "../../src/lib/storage.js";

describe("uploadRecordingToSupabase", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns original URL if Supabase credentials are missing", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const originalUrl = "https://recordings.voicelink.co.in/call123.mp3";
    const url = await uploadRecordingToSupabase("call123", originalUrl);
    expect(url).toBe(originalUrl);
  });

  it("uploads successfully when bucket exists", async () => {
    process.env.SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
    process.env.SUPABASE_BUCKET = "recordings";

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // 1st fetch: download file
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "audio/mpeg" }),
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);

    // 2nd fetch: upload file (success)
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    const originalUrl = "https://recordings.voicelink.co.in/call123.mp3";
    const url = await uploadRecordingToSupabase("call123", originalUrl);

    expect(url).toBe("https://mock.supabase.co/storage/v1/object/public/recordings/call123.mp3");
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    // Verify download call
    expect(fetchSpy.mock.calls[0][0]).toBe(originalUrl);

    // Verify upload call
    expect(fetchSpy.mock.calls[1][0]).toBe("https://mock.supabase.co/storage/v1/object/recordings/call123.mp3");
    const uploadOpts = fetchSpy.mock.calls[1][1];
    expect(uploadOpts?.method).toBe("POST");
    expect(uploadOpts?.headers).toEqual({
      Authorization: "Bearer mock-key",
      "Content-Type": "audio/mpeg",
      "x-upsert": "true",
    });
  });

  it("creates bucket on demand if upload returns bucket not found (HTTP 400)", async () => {
    process.env.SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
    process.env.SUPABASE_BUCKET = "recordings";

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // 1st fetch: download file
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "audio/mpeg" }),
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);

    // 2nd fetch: upload file fails with bucket not found
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      clone: () => ({
        text: async () => JSON.stringify({ statusCode: "404", error: "Bucket not found", message: "Bucket not found" }),
      }),
    } as unknown as Response);

    // 3rd fetch: create bucket
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    // 4th fetch: upload file retry (success)
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    const originalUrl = "https://recordings.voicelink.co.in/call123.mp3";
    const url = await uploadRecordingToSupabase("call123", originalUrl);

    expect(url).toBe("https://mock.supabase.co/storage/v1/object/public/recordings/call123.mp3");
    expect(fetchSpy).toHaveBeenCalledTimes(4);

    // Verify create bucket endpoint called
    expect(fetchSpy.mock.calls[2][0]).toBe("https://mock.supabase.co/storage/v1/bucket");
    expect(JSON.parse(fetchSpy.mock.calls[2][1]?.body as string)).toEqual({
      id: "recordings",
      name: "recordings",
      public: true,
    });
  });

  it("falls back to original URL if download fails", async () => {
    process.env.SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // 1st fetch: download fails
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    const originalUrl = "https://recordings.voicelink.co.in/call123.mp3";
    const url = await uploadRecordingToSupabase("call123", originalUrl);

    expect(url).toBe(originalUrl);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
