import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  BookingAction,
  ReservationActionData,
  ReservationData,
} from "./types";

type ActionOf<T extends BookingAction["type"]> = Extract<BookingAction, { type: T }>;

// Compile-time exhaustiveness: adding an action to the union without
// updating this switch fails the type-check.
function assertNever(value: never): never {
  throw new Error(`Unhandled booking action: ${JSON.stringify(value)}`);
}

function describeAction(action: BookingAction): string {
  switch (action.type) {
    case "PREFILL_RESERVATION":
      return "prefill";
    case "CANCEL_BOOKING":
      return "cancel";
    case "VIEW_RESERVATIONS":
      return "view";
    default:
      return assertNever(action);
  }
}

// Used only for compile-time checks of invalid literals below.
function accept(_action: BookingAction): void {}

describe("booking types - payloads", () => {
  it("defines the exact ReservationData shape with every field optional", () => {
    expectTypeOf<ReservationData>().toEqualTypeOf<{
      date?: string;
      time?: string;
      partySize?: number;
      locationId?: string;
      guests?: number;
      branchId?: string;
      branchName?: string;
    }>();

    const empty: ReservationData = {};
    expect(empty).toEqual({});
  });

  it("accepts a fully populated reservation", () => {
    const full: ReservationData = {
      date: "2026-12-01",
      time: "19:30",
      partySize: 4,
      locationId: "loc-1",
      guests: 4,
      branchId: "branch-1",
      branchName: "Downtown",
    };

    expect(Object.keys(full)).toHaveLength(7);
  });

  it("types party and guest counts as numbers", () => {
    expectTypeOf<ReservationData["partySize"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<ReservationData["guests"]>().toEqualTypeOf<number | undefined>();
  });

  it("defines ReservationActionData with an optional bookingId", () => {
    expectTypeOf<ReservationActionData>().toEqualTypeOf<{ bookingId?: string }>();

    const empty: ReservationActionData = {};
    expect(empty).toEqual({});
  });
});

describe("booking types - BookingAction union", () => {
  it("contains exactly the three action types", () => {
    expectTypeOf<BookingAction["type"]>().toEqualTypeOf<
      "PREFILL_RESERVATION" | "CANCEL_BOOKING" | "VIEW_RESERVATIONS"
    >();
  });

  it("requires a string label on every action", () => {
    expectTypeOf<BookingAction["label"]>().toEqualTypeOf<string>();
  });

  it("pairs each action with the right optional payload", () => {
    expectTypeOf<ActionOf<"PREFILL_RESERVATION">["data"]>().toEqualTypeOf<
      ReservationData | undefined
    >();
    expectTypeOf<ActionOf<"CANCEL_BOOKING">["data"]>().toEqualTypeOf<
      ReservationActionData | undefined
    >();
    expectTypeOf<ActionOf<"VIEW_RESERVATIONS">["data"]>().toEqualTypeOf<
      Record<string, never> | undefined
    >();
  });

  it("narrows the payload by the discriminant", () => {
    const action = { type: "CANCEL_BOOKING", label: "Cancel" } as BookingAction;

    if (action.type === "CANCEL_BOOKING") {
      expectTypeOf(action.data).toEqualTypeOf<ReservationActionData | undefined>();
    }
    if (action.type === "PREFILL_RESERVATION") {
      expectTypeOf(action.data).toEqualTypeOf<ReservationData | undefined>();
    }
    expect(action.type).toBe("CANCEL_BOOKING");
  });

  it("accepts every action with and without a payload", () => {
    const actions: BookingAction[] = [
      { type: "PREFILL_RESERVATION", label: "Book a table" },
      {
        type: "PREFILL_RESERVATION",
        label: "Book a table",
        data: { date: "2026-12-01", time: "19:30", partySize: 2 },
      },
      { type: "CANCEL_BOOKING", label: "Cancel" },
      { type: "CANCEL_BOOKING", label: "Cancel", data: { bookingId: "b-1" } },
      { type: "VIEW_RESERVATIONS", label: "My bookings" },
      { type: "VIEW_RESERVATIONS", label: "My bookings", data: {} },
    ];

    expect(actions.map(describeAction)).toEqual([
      "prefill",
      "prefill",
      "cancel",
      "cancel",
      "view",
      "view",
    ]);
  });

  it("rejects invalid actions at compile time", () => {
    // Each directive must stay on the line that contains the error.
    // If a type is loosened, the directive becomes "unused" and tsc fails.
    // @ts-expect-error unknown action type
    accept({ type: "NOPE", label: "x" });
    // @ts-expect-error label is required
    accept({ type: "VIEW_RESERVATIONS" });
    // @ts-expect-error label must be a string
    accept({ type: "VIEW_RESERVATIONS", label: 1 });
    // @ts-expect-error VIEW_RESERVATIONS carries no payload fields
    accept({ type: "VIEW_RESERVATIONS", label: "x", data: { a: 1 } });
    // @ts-expect-error partySize must be a number
    accept({ type: "PREFILL_RESERVATION", label: "x", data: { partySize: "4" } });
    // @ts-expect-error unknown reservation field
    accept({ type: "PREFILL_RESERVATION", label: "x", data: { color: "red" } });
    // @ts-expect-error bookingId must be a string
    accept({ type: "CANCEL_BOOKING", label: "x", data: { bookingId: 1 } });
    // @ts-expect-error cancel payload cannot carry reservation fields
    accept({ type: "CANCEL_BOOKING", label: "x", data: { date: "2026-12-01" } });

    expect(true).toBe(true);
  });
});