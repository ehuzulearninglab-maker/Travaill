import type { Metadata } from "next";
import { TranscriptionAudioClient } from "@/components/transcription-audio-client";

export const metadata: Metadata = {
  title: "Transcription audio | Cantine Intelligente",
  description: "Transcription de fichiers audio longs avec decoupage automatique."
};

export default function TranscriptionPage() {
  return <TranscriptionAudioClient />;
}
