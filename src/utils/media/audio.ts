"use client";

let audioInstance: HTMLAudioElement | null = null;
let unlocked = false;
let unlockInFlight: Promise<boolean> | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioInstance) {
    audioInstance = new Audio("/notification.wav");
    audioInstance.volume = 0.7;
    audioInstance.preload = "auto";
  }
  return audioInstance;
}

export function unlockNotificationSound(): Promise<boolean> {
  if (unlocked) return Promise.resolve(true);
  if (typeof window === "undefined") return Promise.resolve(false);
  if (unlockInFlight) return unlockInFlight;

  const audio = getAudio();
  if (!audio) return Promise.resolve(false);

  audio.muted = true;

  unlockInFlight = audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      unlocked = true;
      return true;
    }).catch(() => false).finally(() => {
      audio.muted = false;
      unlockInFlight = null;
    });

  return unlockInFlight;
}

export const playNotificationSound = () => {
  const audio = getAudio();
  if (!audio) return;
  if (!unlocked) {
    console.warn("🔇 Notification sound skipped — no user interaction yet.");
    return;
  }
  const node = audio.cloneNode(true) as HTMLAudioElement;
  node.muted = false;
  node.volume = 0.7;
  node.currentTime = 0;
  node.play().catch((err) => {
    console.error("❌ Notification sound failed to play:", err);
  });
};
