"use client";

import { useCallback, useEffect, useState } from "react";

import { markdownToSpeech } from "@/lib/ai/markdownToSpeech";

function speechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Text-to-speech for one message at a time; stops on unmount. */
export function useSpeech() {
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );

  const speak = useCallback(
    (messageId: string, text: string) => {
      if (!speechAvailable()) return;

      if (speakingMessageId === messageId) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(markdownToSpeech(text));
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      setSpeakingMessageId(messageId);
      window.speechSynthesis.speak(utterance);
    },
    [speakingMessageId],
  );

  useEffect(() => {
    return () => {
      if (speechAvailable()) window.speechSynthesis.cancel();
    };
  }, []);

  return { speakingMessageId, speak };
}