import { describe, it, expect, vi, beforeEach } from "vitest";

const from = vi.fn();
const getSession = vi.fn();

vi.mock("./supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
    auth: { getSession: (...args: unknown[]) => getSession(...args) },
  },
}));

import { fetchNotes, createNote, updateNote, deleteNote } from "./notes";

const SESSION = { data: { session: { user: { id: "user-1" } } } };
const NO_SESSION = { data: { session: null } };

beforeEach(() => {
  from.mockReset();
  getSession.mockReset();
});

describe("fetchNotes (read)", () => {
  it("maps a Supabase row into the app's Note shape", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "note-1",
          content: "hello",
          created_at: "2026-01-01T00:00:00.000Z",
          timestamp_seconds: 42,
          is_private: true,
          profile_id: "user-1",
        },
      ],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    const notes = await fetchNotes("video-1");

    expect(from).toHaveBeenCalledWith("notes");
    expect(eq).toHaveBeenCalledWith("video_id", "video-1");
    expect(notes).toEqual([
      {
        id: "note-1",
        text: "hello",
        createdAt: new Date("2026-01-01T00:00:00.000Z").getTime(),
        videoTime: 42,
        isPrivate: true,
        profileId: "user-1",
        username: "Unknown User",
      },
    ]);
  });

  it("returns an empty array instead of throwing when Supabase errors", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: new Error("boom") });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    const notes = await fetchNotes("video-1");

    expect(notes).toEqual([]);
  });
});

describe("createNote (create)", () => {
  it("skips saving when there is no signed-in session", async () => {
    getSession.mockResolvedValue(NO_SESSION);

    const result = await createNote("video-1", "hi", 10, false);

    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("inserts the note under the signed-in user and returns it", async () => {
    getSession.mockResolvedValue(SESSION);
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "note-2",
        content: "hi",
        created_at: "2026-01-02T00:00:00.000Z",
        timestamp_seconds: 10,
        is_private: false,
        profile_id: "user-1",
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });

    const profileSingle = vi.fn().mockResolvedValue({
      data: { username: "testuser" },
      error: null,
    });
    const profileEq = vi.fn().mockReturnValue({ single: profileSingle });
    const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });

    from.mockImplementation((table: string) =>
      table === "notes" ? { insert } : { select: profileSelect }
    );

    const result = await createNote("video-1", "hi", 10.9, false);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_id: "user-1",
        video_id: "video-1",
        timestamp_seconds: 10, // floored
        content: "hi",
        is_private: false,
      })
    );
    expect(result?.text).toBe("hi");
    expect(result?.username).toBe("testuser");
  });
});

describe("updateNote (update)", () => {
  it("updates the note's content by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ update });

    // nico added bcs error
    await updateNote("note-1", "edited text", false);

    expect(from).toHaveBeenCalledWith("notes");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ content: "edited text" })
    );
    expect(eq).toHaveBeenCalledWith("id", "note-1");
  });
});

describe("deleteNote (delete)", () => {
  it("deletes the note by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ delete: del });

    await deleteNote("note-1");

    expect(from).toHaveBeenCalledWith("notes");
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "note-1");
  });
});
