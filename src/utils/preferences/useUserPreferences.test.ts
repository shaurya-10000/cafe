import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUserPreferences } from "./useUserPreferences";

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn((_column: string, _value: string) => ({ maybeSingle }));
  const select = vi.fn((_columns: string) => ({ eq }));
  const upsert = vi.fn();
  const from = vi.fn((_table: string) => ({ select, upsert }));
  return { maybeSingle, eq, select, upsert, from, client: { from } };
});

// Stable client reference: the hook lists it as an effect dependency.
vi.mock("@/utils/supabase/client", () => ({
  useSupabaseClient: () => mocks.client,
}));

const EMPTY = {
  phone: null,
  address: null,
  default_order_type: null,
  default_payment_method: null,
};

const FULL_ROW = {
  phone: "+91 98765 43210",
  address: "12 Park Street",
  default_order_type: "delivery",
  default_payment_method: "online",
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type Props = { userId: string | null };

function setup(userId: string | null) {
  return renderHook(({ userId: id }: Props) => useUserPreferences(id), {
    initialProps: { userId },
  });
}

async function setupLoaded(userId = "user-1") {
  const hook = setup(userId);
  await waitFor(() => expect(hook.result.current.preferences).not.toBeNull());
  return hook;
}

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.maybeSingle.mockResolvedValue({ data: FULL_ROW, error: null });
  mocks.eq.mockImplementation(() => ({ maybeSingle: mocks.maybeSingle }));
  mocks.select.mockImplementation(() => ({ eq: mocks.eq }));
  mocks.from.mockImplementation(() => ({
    select: mocks.select,
    upsert: mocks.upsert,
  }));
  mocks.upsert.mockResolvedValue({ error: null });
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe("useUserPreferences - loading", () => {
  it("does nothing and is not loading when there is no user", () => {
    const { result } = setup(null);

    expect(result.current.preferences).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("reports loading until the row resolves, then exposes preferences", async () => {
    const pending = deferred<{ data: unknown; error: unknown }>();
    mocks.maybeSingle.mockReturnValueOnce(pending.promise);

    const { result } = setup("user-1");

    expect(result.current.loading).toBe(true);
    expect(result.current.preferences).toBeNull();

    await act(async () => {
      pending.resolve({ data: FULL_ROW, error: null });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.preferences).toEqual(FULL_ROW);
  });

  it("queries user_preferences with the expected columns and user filter", async () => {
    await setupLoaded("user-42");

    expect(mocks.from).toHaveBeenCalledWith("user_preferences");
    expect(mocks.select).toHaveBeenCalledWith(
      "phone,address,default_order_type,default_payment_method",
    );
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-42");
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("resolves to empty preferences when the user has no row", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { result } = await setupLoaded();

    expect(result.current.preferences).toEqual(EMPTY);
    expect(result.current.loading).toBe(false);
  });

  it("keeps valid values exactly as stored, including surrounding whitespace", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { ...FULL_ROW, phone: "  555 0100  ", default_order_type: "pickup", default_payment_method: "in_person" },
      error: null,
    });

    const { result } = await setupLoaded();

    expect(result.current.preferences).toEqual({
      phone: "  555 0100  ",
      address: "12 Park Street",
      default_order_type: "pickup",
      default_payment_method: "in_person",
    });
  });

  it.each([
    ["empty string", ""],
    ["whitespace only", "   \t\n"],
    ["a number", 5551234],
    ["an object", { value: "x" }],
    ["undefined", undefined],
    ["null", null],
  ])("normalizes %s text columns to null", async (_label, bad) => {
    mocks.maybeSingle.mockResolvedValue({
      data: { ...FULL_ROW, phone: bad, address: bad },
      error: null,
    });

    const { result } = await setupLoaded();

    expect(result.current.preferences?.phone).toBeNull();
    expect(result.current.preferences?.address).toBeNull();
  });

  it.each([
    ["unknown string", "teleport"],
    ["wrong case", "Pickup"],
    ["number", 1],
    ["empty string", ""],
    ["null", null],
    ["undefined", undefined],
  ])("normalizes %s enum columns to null", async (_label, bad) => {
    mocks.maybeSingle.mockResolvedValue({
      data: { ...FULL_ROW, default_order_type: bad, default_payment_method: bad },
      error: null,
    });

    const { result } = await setupLoaded();

    expect(result.current.preferences?.default_order_type).toBeNull();
    expect(result.current.preferences?.default_payment_method).toBeNull();
  });

  it("ignores unexpected extra columns", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { ...FULL_ROW, user_id: "user-1", is_admin: true },
      error: null,
    });

    const { result } = await setupLoaded();

    expect(result.current.preferences).toEqual(FULL_ROW);
  });

  it("falls back to empty preferences and logs when Supabase returns an error", async () => {
    const failure = { message: "permission denied", code: "42501" };
    mocks.maybeSingle.mockResolvedValue({ data: null, error: failure });

    const { result } = await setupLoaded("user-9");

    expect(result.current.preferences).toEqual(EMPTY);
    expect(result.current.loading).toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      "[user-preferences] load failed",
      { userId: "user-9" },
      failure,
    );
  });

  it("falls back to empty preferences when the request rejects", async () => {
    const failure = new Error("network down");
    mocks.maybeSingle.mockRejectedValue(failure);

    const { result } = await setupLoaded();

    expect(result.current.preferences).toEqual(EMPTY);
    expect(consoleError).toHaveBeenCalledWith(
      "[user-preferences] load failed",
      { userId: "user-1" },
      failure,
    );
  });

  it("does not update state or log after unmount (success path)", async () => {
    const pending = deferred<{ data: unknown; error: unknown }>();
    mocks.maybeSingle.mockReturnValueOnce(pending.promise);

    const { unmount } = setup("user-1");
    unmount();

    await act(async () => {
      pending.resolve({ data: FULL_ROW, error: null });
    });

    expect(consoleError).not.toHaveBeenCalled();
  });

  it("does not log a load failure after unmount (error path)", async () => {
    const pending = deferred<{ data: unknown; error: unknown }>();
    mocks.maybeSingle.mockReturnValueOnce(pending.promise);

    const { unmount } = setup("user-1");
    unmount();

    await act(async () => {
      pending.reject(new Error("late failure"));
    });

    expect(consoleError).not.toHaveBeenCalled();
  });

  it("refetches when userId changes and never exposes the previous user's data", async () => {
    const second = deferred<{ data: unknown; error: unknown }>();
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: FULL_ROW, error: null })
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = await setupLoaded("user-1");
    expect(result.current.preferences).toEqual(FULL_ROW);

    rerender({ userId: "user-2" });

    expect(result.current.preferences).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(mocks.eq).toHaveBeenLastCalledWith("user_id", "user-2");

    await act(async () => {
      second.resolve({
        data: { ...FULL_ROW, phone: "999", default_order_type: "pickup" },
        error: null,
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.preferences).toEqual({
      ...FULL_ROW,
      phone: "999",
      default_order_type: "pickup",
    });
  });

  it("discards a stale response from a previous user (race)", async () => {
    const first = deferred<{ data: unknown; error: unknown }>();
    const second = deferred<{ data: unknown; error: unknown }>();
    mocks.maybeSingle
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = setup("user-1");
    rerender({ userId: "user-2" });

    await act(async () => {
      second.resolve({ data: { ...FULL_ROW, phone: "second" }, error: null });
    });
    await act(async () => {
      first.resolve({ data: { ...FULL_ROW, phone: "first" }, error: null });
    });

    expect(result.current.preferences?.phone).toBe("second");
  });

  it("returns to the idle state when the user signs out", async () => {
    const { result, rerender } = await setupLoaded("user-1");

    rerender({ userId: null });

    expect(result.current.preferences).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

describe("useUserPreferences - save", () => {
  it("returns a sign-in message and skips the network when signed out", async () => {
    const { result } = setup(null);

    let outcome: string | null = "unset";
    await act(async () => {
      outcome = await result.current.save({ phone: "123" });
    });

    expect(outcome).toBe("You need to be signed in.");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("upserts keyed on user_id and returns null on success", async () => {
    const { result } = await setupLoaded("user-1");

    let outcome: string | null = "unset";
    await act(async () => {
      outcome = await result.current.save({ phone: "555" });
    });

    expect(outcome).toBeNull();
    expect(mocks.from).toHaveBeenLastCalledWith("user_preferences");
    expect(mocks.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", phone: "555" },
      { onConflict: "user_id" },
    );
  });

  it("merges the patch into existing preferences after a successful save", async () => {
    const { result } = await setupLoaded();

    await act(async () => {
      await result.current.save({ address: "New Address", default_order_type: "pickup" });
    });

    expect(result.current.preferences).toEqual({
      ...FULL_ROW,
      address: "New Address",
      default_order_type: "pickup",
    });
  });

  it("allows clearing a field by saving null", async () => {
    const { result } = await setupLoaded();

    await act(async () => {
      await result.current.save({ phone: null });
    });

    expect(mocks.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", phone: null },
      { onConflict: "user_id" },
    );
    expect(result.current.preferences).toEqual({ ...FULL_ROW, phone: null });
  });

  it("merges onto empty preferences when saving before the load finishes", async () => {
    const pending = deferred<{ data: unknown; error: unknown }>();
    mocks.maybeSingle.mockReturnValueOnce(pending.promise);

    const { result } = setup("user-1");

    await act(async () => {
      await result.current.save({ phone: "555" });
    });

    expect(result.current.preferences).toEqual({ ...EMPTY, phone: "555" });
  });

  it("returns a friendly message, logs, and leaves state untouched when Supabase errors", async () => {
    const failure = { message: "duplicate key", code: "23505" };
    mocks.upsert.mockResolvedValue({ error: failure });

    const { result } = await setupLoaded();
    const before = result.current.preferences;

    let outcome: string | null = null;
    await act(async () => {
      outcome = await result.current.save({ phone: "555" });
    });

    expect(outcome).toBe("Couldn\u2019t save. Please try again.");
    expect(result.current.preferences).toEqual(before);
    expect(consoleError).toHaveBeenCalledWith(
      "[user-preferences] save failed",
      { userId: "user-1" },
      failure,
    );
  });

  it("handles a rejected upsert the same way", async () => {
    mocks.upsert.mockRejectedValue(new Error("offline"));

    const { result } = await setupLoaded();

    let outcome: string | null = null;
    await act(async () => {
      outcome = await result.current.save({ address: "x" });
    });

    expect(outcome).toBe("Couldn\u2019t save. Please try again.");
    expect(result.current.preferences).toEqual(FULL_ROW);
  });

  it("applies consecutive saves cumulatively", async () => {
    const { result } = await setupLoaded();

    await act(async () => {
      await result.current.save({ phone: "111" });
    });
    await act(async () => {
      await result.current.save({ default_payment_method: "in_person" });
    });

    expect(result.current.preferences).toEqual({
      ...FULL_ROW,
      phone: "111",
      default_payment_method: "in_person",
    });
  });

  it("keeps save referentially stable for the same user and changes it for a new one", async () => {
    const { result, rerender } = await setupLoaded("user-1");
    const initial = result.current.save;

    rerender({ userId: "user-1" });
    expect(result.current.save).toBe(initial);

    rerender({ userId: "user-2" });
    expect(result.current.save).not.toBe(initial);
  });

  // Known bug: a save that resolves after the user switched overwrites the
  // shared result with the old userId, so the new user's preferences
  // disappear and `loading` sticks at true. Remove `.fails` once the hook
  // ignores stale saves (e.g. only update when previous.userId === userId).
  it.fails("ignores a save that resolves after the user changed", async () => {
    const pendingSave = deferred<{ error: unknown }>();
    mocks.upsert.mockReturnValueOnce(pendingSave.promise);
    const secondUser = { ...FULL_ROW, phone: "user-2-phone" };
    mocks.maybeSingle
      .mockResolvedValueOnce({ data: FULL_ROW, error: null })
      .mockResolvedValueOnce({ data: secondUser, error: null });

    const { result, rerender } = await setupLoaded("user-1");
    const staleSave = result.current.save;

    let savePromise!: Promise<string | null>;
    act(() => {
      savePromise = staleSave({ phone: "late" });
    });

    rerender({ userId: "user-2" });
    await waitFor(() => expect(result.current.preferences).toEqual(secondUser));

    await act(async () => {
      pendingSave.resolve({ error: null });
      await savePromise;
    });

    expect(result.current.preferences).toEqual(secondUser);
  });
});