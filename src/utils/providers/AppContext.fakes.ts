// AppContext.fakes.ts
// Test doubles shared by the AppContext suites. Not itself a test file.
import { vi } from "vitest";

import type { AppNotification } from "./AppContext";

export interface QueryResult {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

export interface QueryRecord {
  table: string;
  op: "select" | "update" | "upsert";
  columns?: string;
  options?: unknown;
  payload?: unknown;
  filters: Array<[string, unknown]>;
  signal?: AbortSignal;
  single: boolean;
}

export type Route =
  | QueryResult
  | ((query: QueryRecord) => QueryResult | Promise<QueryResult>);

export interface FakeBuilder extends PromiseLike<QueryResult> {
  select(columns?: string, options?: unknown): FakeBuilder;
  update(payload: unknown): FakeBuilder;
  upsert(payload: unknown, options?: unknown): FakeBuilder;
  eq(column: string, value: unknown): FakeBuilder;
  abortSignal(signal: AbortSignal): FakeBuilder;
  maybeSingle(): FakeBuilder;
}

export interface ChannelFilter {
  event: string;
  schema: string;
  table: string;
  filter?: string;
}

export interface FakeChannel {
  name: string;
  listeners: Array<{ filter: ChannelFilter; callback: (payload: unknown) => void }>;
  on(_type: string, filter: ChannelFilter, callback: (payload: unknown) => void): FakeChannel;
  subscribe(callback: (status: string, err?: { message?: string }) => void): FakeChannel;
  /** Delivers a postgres_changes payload to every matching listener. */
  emit(table: string, event: "INSERT" | "UPDATE" | "DELETE", payload?: unknown): void;
  /** Simulates a channel status callback (SUBSCRIBED, CHANNEL_ERROR, ...). */
  status(status: string, err?: { message?: string }): void;
}

function createFakeChannel(name: string): FakeChannel {
  let statusCallback: ((status: string, err?: { message?: string }) => void) | undefined;
  const channel: FakeChannel = {
    name,
    listeners: [],
    on(_type, filter, callback) {
      channel.listeners.push({ filter, callback });
      return channel;
    },
    subscribe(callback) {
      statusCallback = callback;
      return channel;
    },
    emit(table, event, payload) {
      for (const listener of channel.listeners) {
        const { filter } = listener;
        if (filter.table === table && (filter.event === "*" || filter.event === event)) {
          listener.callback(payload);
        }
      }
    },
    status(status, err) {
      statusCallback?.(status, err);
    },
  };
  return channel;
}

/**
 * A minimal Supabase stand-in: a chainable, awaitable query builder whose
 * results come from `routes` (keyed "table:op"), plus a fake realtime channel.
 */
export function createFakeSupabase() {
  const routes: Record<string, Route> = {
    "cart_items:select": { data: [], error: null },
    "favorites:select": { count: 0, error: null },
    "notifications:select": { count: 0, error: null },
    "notifications:update": { error: null },
    "notification_settings:select": { data: null, error: null },
    "notification_settings:upsert": { error: null },
  };
  const queries: QueryRecord[] = [];
  const channels: FakeChannel[] = [];

  async function runRoute(query: QueryRecord): Promise<QueryResult> {
    const route = routes[`${query.table}:${query.op}`];
    if (typeof route === "function") return route(query);
    return route ?? { data: null, error: null };
  }

  function from(table: string): FakeBuilder {
    const record: QueryRecord = { table, op: "select", filters: [], single: false };
    const builder: FakeBuilder = {
      select(columns, options) {
        record.columns = columns;
        record.options = options;
        return builder;
      },
      update(payload) {
        record.op = "update";
        record.payload = payload;
        return builder;
      },
      upsert(payload, options) {
        record.op = "upsert";
        record.payload = payload;
        record.options = options;
        return builder;
      },
      eq(column, value) {
        record.filters.push([column, value]);
        return builder;
      },
      abortSignal(signal) {
        record.signal = signal;
        return builder;
      },
      maybeSingle() {
        record.single = true;
        return builder;
      },
      then(onfulfilled, onrejected) {
        queries.push(record);
        return runRoute(record).then(onfulfilled, onrejected);
      },
    };
    return builder;
  }

  const client = {
    from: vi.fn(from),
    channel: vi.fn((name: string) => {
      const channel = createFakeChannel(name);
      channels.push(channel);
      return channel;
    }),
    removeChannel: vi.fn<(channel: unknown) => Promise<string>>(async () => "ok"),
    realtime: {
      setAuth: vi.fn<(token: string) => Promise<void>>(async () => {}),
    },
  };

  return {
    client,
    routes,
    queries,
    channels,
    queriesFor(table: string, op?: QueryRecord["op"]) {
      return queries.filter((q) => q.table === table && (!op || q.op === op));
    },
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "n1",
    user_id: "user_1",
    title: "Order ready",
    message: "Your latte is ready",
    type: "order",
    order_id: null,
    created_at: "2026-01-01T00:00:00Z",
    is_read: false,
    ...overrides,
  };
}