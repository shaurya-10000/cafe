import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AudioModule = typeof import("./audio");

let instances: FakeAudio[] = [];
let clones: FakeAudio[] = [];

class FakeAudio {
  readonly src: string;
  volume = 1;
  preload = "";
  muted = false;
  currentTime = 0;
  play = vi.fn<() => Promise<void>>(() => Promise.resolve());
  pause = vi.fn<() => void>();
  cloneNode = vi.fn((_deep?: boolean): FakeAudio => makeClone(this.src));

  constructor(src: string) {
    this.src = src;
  }
}

// Clones start in a "dirty" state so the tests prove the code resets them.
function makeClone(src: string): FakeAudio {
  const clone = new FakeAudio(src);
  clone.muted = true;
  clone.volume = 0.1;
  clone.currentTime = 9;
  clones.push(clone);
  return clone;
}

class AudioStub {
  constructor(src: string) {
    const audio = new FakeAudio(src);
    instances.push(audio);
    return audio;
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// The module keeps singletons (audio, unlocked, in-flight), so every test
// gets a fresh copy.
async function load(): Promise<AudioModule> {
  return import("./audio");
}

async function loadUnlocked() {
  const mod = await load();
  await expect(mod.unlockNotificationSound()).resolves.toBe(true);
  return mod;
}

let warn: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetModules();
  instances = [];
  clones = [];
  vi.stubGlobal("Audio", AudioStub);
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  error = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  warn.mockRestore();
  error.mockRestore();
});

describe("unlockNotificationSound", () => {
  it("resolves false on the server without creating an Audio element", async () => {
    const { unlockNotificationSound } = await load();
    vi.stubGlobal("window", undefined);

    await expect(unlockNotificationSound()).resolves.toBe(false);
    expect(instances).toHaveLength(0);
  });

  it("creates one audio element with the expected source and settings", async () => {
    const { unlockNotificationSound } = await load();

    await unlockNotificationSound();

    expect(instances).toHaveLength(1);
    expect(instances[0].src).toBe("/notification.wav");
    expect(instances[0].volume).toBe(0.7);
    expect(instances[0].preload).toBe("auto");
  });

  it("plays muted, then pauses, rewinds, unmutes and resolves true", async () => {
    const { unlockNotificationSound } = await load();
    const pending = deferred<void>();
    let mutedDuringPlay: boolean | null = null;

    const originalPlay = FakeAudio.prototype;
    void originalPlay;

    const promise = (async () => {
      // Arrange the next created element before unlocking.
      vi.stubGlobal(
        "Audio",
        class {
          constructor(src: string) {
            const audio = new FakeAudio(src);
            audio.currentTime = 5;
            audio.play.mockImplementation(() => {
              mutedDuringPlay = audio.muted;
              return pending.promise;
            });
            instances.push(audio);
            return audio;
          }
        },
      );
      return unlockNotificationSound();
    })();

    const audio = instances[0];
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(mutedDuringPlay).toBe(true);
    expect(audio.pause).not.toHaveBeenCalled();

    pending.resolve();

    await expect(promise).resolves.toBe(true);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
    expect(audio.muted).toBe(false);
  });

  it("short-circuits to true once unlocked, without touching the element again", async () => {
    const { unlockNotificationSound } = await loadUnlocked();
    const audio = instances[0];

    await expect(unlockNotificationSound()).resolves.toBe(true);

    expect(instances).toHaveLength(1);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("shares a single in-flight attempt between concurrent callers", async () => {
    const { unlockNotificationSound } = await load();
    const pending = deferred<void>();
    vi.stubGlobal(
      "Audio",
      class {
        constructor(src: string) {
          const audio = new FakeAudio(src);
          audio.play.mockReturnValue(pending.promise);
          instances.push(audio);
          return audio;
        }
      },
    );

    const first = unlockNotificationSound();
    const second = unlockNotificationSound();

    expect(second).toBe(first);
    expect(instances).toHaveLength(1);
    expect(instances[0].play).toHaveBeenCalledTimes(1);

    pending.resolve();
    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
  });

  it("resolves false, unmutes and stays locked when play is rejected", async () => {
    const { unlockNotificationSound, playNotificationSound } = await load();
    vi.stubGlobal(
      "Audio",
      class {
        constructor(src: string) {
          const audio = new FakeAudio(src);
          audio.play.mockRejectedValue(new DOMException("blocked", "NotAllowedError"));
          instances.push(audio);
          return audio;
        }
      },
    );

    await expect(unlockNotificationSound()).resolves.toBe(false);

    const audio = instances[0];
    expect(audio.muted).toBe(false);
    expect(audio.pause).not.toHaveBeenCalled();

    playNotificationSound();
    expect(audio.cloneNode).not.toHaveBeenCalled();
  });

  it("clears the in-flight state after a failure so a later attempt can succeed", async () => {
    const { unlockNotificationSound } = await load();
    vi.stubGlobal(
      "Audio",
      class {
        constructor(src: string) {
          const audio = new FakeAudio(src);
          audio.play
            .mockRejectedValueOnce(new Error("not yet"))
            .mockResolvedValueOnce(undefined);
          instances.push(audio);
          return audio;
        }
      },
    );

    await expect(unlockNotificationSound()).resolves.toBe(false);
    await expect(unlockNotificationSound()).resolves.toBe(true);

    expect(instances).toHaveLength(1);
    expect(instances[0].play).toHaveBeenCalledTimes(2);
  });
});

describe("playNotificationSound", () => {
  it("is a silent no-op on the server", async () => {
    const { playNotificationSound } = await load();
    vi.stubGlobal("window", undefined);

    expect(() => playNotificationSound()).not.toThrow();
    expect(instances).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns and does not play before the sound is unlocked", async () => {
    const { playNotificationSound } = await load();

    playNotificationSound();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("no user interaction yet"),
    );
    expect(instances[0].cloneNode).not.toHaveBeenCalled();
    expect(instances[0].play).not.toHaveBeenCalled();
  });

  it("plays a deep clone that is unmuted, at 0.7 volume and rewound", async () => {
    const { playNotificationSound } = await loadUnlocked();

    playNotificationSound();

    const original = instances[0];
    expect(original.cloneNode).toHaveBeenCalledWith(true);
    expect(clones).toHaveLength(1);

    const clone = clones[0];
    expect(clone.muted).toBe(false);
    expect(clone.volume).toBe(0.7);
    expect(clone.currentTime).toBe(0);
    expect(clone.play).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("never replays the original element, so the unlocked element stays untouched", async () => {
    const { playNotificationSound } = await loadUnlocked();
    const original = instances[0];
    const playsAfterUnlock = original.play.mock.calls.length;

    playNotificationSound();

    expect(original.play).toHaveBeenCalledTimes(playsAfterUnlock);
  });

  it("uses an independent clone per call so sounds can overlap", async () => {
    const { playNotificationSound } = await loadUnlocked();

    playNotificationSound();
    playNotificationSound();
    playNotificationSound();

    expect(clones).toHaveLength(3);
    expect(new Set(clones).size).toBe(3);
    clones.forEach((clone) => expect(clone.play).toHaveBeenCalledTimes(1));
  });

  it("logs and swallows a rejected play() on the clone", async () => {
    const { playNotificationSound } = await loadUnlocked();
    const failure = new DOMException("blocked", "NotAllowedError");
    const original = instances[0];
    original.cloneNode.mockImplementationOnce(() => {
      const clone = makeClone(original.src);
      clone.play.mockRejectedValue(failure);
      return clone;
    });

    expect(() => playNotificationSound()).not.toThrow();
    await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(1));

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("failed to play"),
      failure,
    );
  });

  it("reuses the same underlying element across calls", async () => {
    const { playNotificationSound } = await loadUnlocked();

    playNotificationSound();
    playNotificationSound();

    expect(instances).toHaveLength(1);
    expect(instances[0].cloneNode).toHaveBeenCalledTimes(2);
  });
});