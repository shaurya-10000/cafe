export class CircuitOpenError extends Error {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super(`Upstream circuit is open; retry in ~${retryAfterSeconds}s.`);
    this.name = "CircuitOpenError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type CircuitState = "closed" | "open" | "half-open";
export type AiSurface = "customer" | "admin" | "title";

export interface CircuitBreakerOptions {
  readonly failureThreshold: number;
  readonly cooldownMs: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  cooldownMs: 30_000,
};

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private openedAt = 0;
  private probeInFlight = false;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.failureThreshold = options.failureThreshold ?? DEFAULT_OPTIONS.failureThreshold;
    this.cooldownMs = options.cooldownMs ?? DEFAULT_OPTIONS.cooldownMs;
  }

  getState(now: number = Date.now()): CircuitState {
    if (this.state === "open" && now - this.openedAt >= this.cooldownMs) {
      return "half-open";
    }
    return this.state;
  }

  private remainingCooldownSeconds(now: number): number {
    if (this.state !== "open") return 0;
    const elapsed = now - this.openedAt;
    const remainingMs = Math.max(0, this.cooldownMs - elapsed);
    return Math.max(1, Math.ceil(remainingMs / 1000));
  }

  async guard<T>(fn: () => Promise<T>, isFailure: (err: unknown) => boolean, now: number = Date.now()): Promise<T> {
    const currentState = this.getState(now);

    if (currentState === "open") {
      throw new CircuitOpenError(this.remainingCooldownSeconds(now));
    }

    if (currentState === "half-open") {
      this.state = "half-open";
      if (this.probeInFlight) throw new CircuitOpenError(1);
      this.probeInFlight = true;
      try {
        const result = await fn();
        this.state = "closed";
        this.failureCount = 0;
        return result;
      } catch (err) {
        this.state = "open";
        this.openedAt = Date.now();
        this.failureCount = 0;
        throw err;
      } finally {
        this.probeInFlight = false;
      }
    }

    try {
      const result = await fn();
      this.failureCount = 0;
      return result;
    } catch (err) {
      if (!isFailure(err)) throw err;
      this.failureCount += 1;
      if (this.failureCount >= this.failureThreshold) {
        this.state = "open";
        this.openedAt = Date.now();
        this.failureCount = 0;
      }
      throw err;
    }
  }

  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.openedAt = 0;
    this.probeInFlight = false;
  }

  inspect(now: number = Date.now()) {
    return {
      state: this.getState(now),
      failureCount: this.failureCount,
      remainingCooldownSeconds: this.remainingCooldownSeconds(now),
    };
  }
}

const breakers: Record<AiSurface, CircuitBreaker> = {
  customer: new CircuitBreaker(),
  admin: new CircuitBreaker(),
  title: new CircuitBreaker(),
};

export function getBreaker(surface: AiSurface): CircuitBreaker {
  return breakers[surface];
}

export function __resetAllBreakersForTests(): void {
  if (process.env.NODE_ENV === "production") throw new Error("Forbidden in production");
  breakers.customer.reset();
  breakers.admin.reset();
  breakers.title.reset();
}
