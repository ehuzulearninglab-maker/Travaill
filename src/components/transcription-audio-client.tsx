"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Download,
  FileAudio2,
  Loader2,
  Play,
  Settings2
} from "lucide-react";

type SegmentState = {
  index: number;
  start: number;
  end: number;
  bytes: number;
  text: string;
  status: "attente" | "encodage" | "envoi" | "termine";
};

type ChunkResponse = {
  index: string;
  filename: string;
  bytes: number;
  model: string;
  text: string;
  error?: string;
  details?: string;
};

class ClientError extends Error {
  constructor(
    message: string,
    readonly details = ""
  ) {
    super(message);
  }
}

const languageOptions = [
  { value: "fr", label: "Francais" },
  { value: "auto", label: "Detection auto" },
  { value: "en", label: "Anglais" }
];

const segmentOptions = [
  { value: "60", label: "1 min" },
  { value: "90", label: "1 min 30" },
  { value: "120", label: "2 min" }
];

const TARGET_SAMPLE_RATE = 16000;
const MAX_ONLINE_CHUNK_BYTES = 4.2 * 1024 * 1024;

export function TranscriptionAudioClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("fr");
  const [segmentSeconds, setSegmentSeconds] = useState("60");
  const [prompt, setPrompt] = useState("");
  const [resultText, setResultText] = useState("");
  const [segments, setSegments] = useState<SegmentState[]>([]);
  const [error, setError] = useState("");
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressLabel, setProgressLabel] = useState("Pret");
  const [progressPercent, setProgressPercent] = useState(0);
  const [modelUsed, setModelUsed] = useState("");
  const [completedAt, setCompletedAt] = useState("");

  const completedSegments = useMemo(
    () => segments.filter((segment) => segment.status === "termine").length,
    [segments]
  );

  function updateSegmentState(index: number, patch: Partial<SegmentState>) {
    setSegments((current) =>
      current.map((segment) => (segment.index === index ? { ...segment, ...patch } : segment))
    );
  }

  async function submitTranscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Selectionnez un fichier audio.");
      setDetails("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setDetails("");
    setSegments([]);
    setResultText("");
    setCopied(false);
    setCompletedAt("");
    setModelUsed("");
    setProgressPercent(0);
    setProgressLabel("Lecture de l'audio");

    let audioContext: AudioContext | null = null;

    try {
      const AudioContextConstructor = getAudioContextConstructor();
      audioContext = new AudioContextConstructor();

      const fileBuffer = await selectedFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(fileBuffer);
      const segmentDuration = Number.parseInt(segmentSeconds, 10);
      const segmentPlan = createSegmentPlan(audioBuffer.duration, segmentDuration);

      setSegments(segmentPlan);
      await yieldToBrowser();

      const partialTexts: string[] = [];

      for (const segment of segmentPlan) {
        setProgressLabel(`Preparation segment ${segment.index}/${segmentPlan.length}`);
        updateSegmentState(segment.index, { status: "encodage" });
        await yieldToBrowser();

        const wavBlob = encodeWavSegment(audioBuffer, segment.start, segment.end, TARGET_SAMPLE_RATE);
        if (wavBlob.size > MAX_ONLINE_CHUNK_BYTES) {
          throw new ClientError(
            "Un segment est trop lourd pour l'hebergement en ligne.",
            "Choisissez des segments de 1 minute puis relancez la transcription."
          );
        }

        updateSegmentState(segment.index, { status: "envoi", bytes: wavBlob.size });
        setProgressLabel(`Transcription segment ${segment.index}/${segmentPlan.length}`);

        const response = await transcribeChunk({
          blob: wavBlob,
          filename: `segment-${String(segment.index).padStart(3, "0")}.wav`,
          index: segment.index,
          total: segmentPlan.length,
          language,
          prompt
        });

        partialTexts.push(response.text);
        setModelUsed(response.model);
        updateSegmentState(segment.index, {
          status: "termine",
          bytes: response.bytes || wavBlob.size,
          text: response.text
        });
        setResultText(partialTexts.filter(Boolean).join("\n\n"));
        setProgressPercent(Math.round((segment.index / segmentPlan.length) * 100));
      }

      setCompletedAt(new Date().toLocaleString("fr-FR"));
      setProgressLabel("Transcription terminee");
    } catch (caught) {
      if (caught instanceof ClientError) {
        setError(caught.message);
        setDetails(caught.details);
      } else if (caught instanceof DOMException) {
        setError("Le navigateur n'a pas pu lire ce fichier audio.");
        setDetails("Essayez un fichier mp3, m4a, wav ou webm, ou convertissez l'audio avant l'import.");
      } else {
        setError(caught instanceof Error ? caught.message : "La transcription a echoue.");
        setDetails("");
      }
      setProgressLabel("Echec");
    } finally {
      await audioContext?.close();
      setIsSubmitting(false);
    }
  }

  async function copyText() {
    if (!resultText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function downloadText() {
    if (!selectedFile || !resultText) {
      return;
    }

    downloadBlob(resultText, `${baseName(selectedFile.name)}-transcription.txt`, "text/plain;charset=utf-8");
  }

  function downloadJson() {
    if (!selectedFile || !resultText) {
      return;
    }

    downloadBlob(
      JSON.stringify(
        {
          filename: selectedFile.name,
          model: modelUsed,
          language,
          completedAt,
          text: resultText,
          segments
        },
        null,
        2
      ),
      `${baseName(selectedFile.name)}-transcription.json`,
      "application/json;charset=utf-8"
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-sauge">Audio</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Transcription audio</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-doux">
          <FileAudio2 size={18} aria-hidden="true" />
          Mode en ligne
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={submitTranscription} className="surface-premium space-y-5 p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Settings2 size={18} className="text-sauge" aria-hidden="true" />
            <h2 className="text-lg font-black text-slate-950">Parametres</h2>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-800">Fichier audio</span>
            <input
              type="file"
              accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm,.ogg,.flac,audio/*"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="champ file:mr-4 file:rounded-lg file:border-0 file:bg-sauge file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
            />
          </label>

          {selectedFile ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <span className="block truncate text-slate-950">{selectedFile.name}</span>
              <span>{formatBytes(selectedFile.size)}</span>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <label className="block space-y-2">
              <span className="text-sm font-black text-slate-800">Langue</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} className="champ">
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-black text-slate-800">Segments</span>
              <select
                value={segmentSeconds}
                onChange={(event) => setSegmentSeconds(event.target.value)}
                className="champ"
              >
                {segmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-800">Contexte optionnel</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="champ min-h-28"
              placeholder="Noms propres, sujet, vocabulaire local..."
            />
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-bold text-slate-600">
              <span>{progressLabel}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-sauge transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <div className="flex items-start gap-2 font-black">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
              {details ? <p className="mt-2 break-words font-semibold">{details}</p> : null}
            </div>
          ) : null}

          <button type="submit" disabled={isSubmitting} className="bouton-primaire w-full">
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Play size={18} aria-hidden="true" />
            )}
            {isSubmitting ? "Transcription en cours" : "Lancer la transcription"}
          </button>
        </form>

        <div className="surface-premium min-h-[520px] p-5">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Resultat</h2>
              {segments.length > 0 ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {completedSegments}/{segments.length} segments
                  {modelUsed ? ` / ${modelUsed}` : ""}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyText} disabled={!resultText} className="bouton-secondaire">
                {copied ? <CheckCircle2 size={17} aria-hidden="true" /> : <Clipboard size={17} aria-hidden="true" />}
                {copied ? "Copie" : "Copier"}
              </button>
              <button type="button" onClick={downloadText} disabled={!resultText} className="bouton-secondaire">
                <Download size={17} aria-hidden="true" />
                TXT
              </button>
              <button type="button" onClick={downloadJson} disabled={!resultText} className="bouton-secondaire">
                <Download size={17} aria-hidden="true" />
                JSON
              </button>
            </div>
          </div>

          {resultText ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">Segments</span>
                  <span className="mt-1 block text-slate-950">{segments.length}</span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">Audio</span>
                  <span className="mt-1 block text-slate-950">{selectedFile ? formatBytes(selectedFile.size) : "-"}</span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">Termine</span>
                  <span className="mt-1 block text-slate-950">{completedAt || "-"}</span>
                </div>
              </div>

              <textarea
                value={resultText}
                readOnly
                className="min-h-[360px] w-full rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-900 outline-none focus:border-sauge focus:ring-2 focus:ring-sauge/20"
              />
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="max-w-sm">
                <FileAudio2 size={42} className="mx-auto text-slate-400" aria-hidden="true" />
                <p className="mt-4 text-lg font-black text-slate-700">Aucune transcription</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Le texte apparaitra ici pendant le traitement des segments.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function createSegmentPlan(duration: number, segmentSeconds: number): SegmentState[] {
  const total = Math.max(1, Math.ceil(duration / segmentSeconds));
  return Array.from({ length: total }, (_, index) => {
    const start = index * segmentSeconds;
    const end = Math.min(duration, start + segmentSeconds);
    return {
      index: index + 1,
      start,
      end,
      bytes: 0,
      text: "",
      status: "attente"
    };
  });
}

async function transcribeChunk(input: {
  blob: Blob;
  filename: string;
  index: number;
  total: number;
  language: string;
  prompt: string;
}) {
  const body = new FormData();
  body.append("file", input.blob, input.filename);
  body.append("index", String(input.index));
  body.append("total", String(input.total));
  body.append("language", input.language);
  body.append("prompt", input.prompt);

  const response = await fetch("/api/transcription/chunk", {
    method: "POST",
    body
  });
  const payload = (await response.json()) as ChunkResponse;

  if (!response.ok) {
    throw new ClientError(payload.error || "La transcription a echoue.", payload.details || "");
  }

  return payload;
}

function encodeWavSegment(audioBuffer: AudioBuffer, startSeconds: number, endSeconds: number, targetSampleRate: number) {
  const sourceSampleRate = audioBuffer.sampleRate;
  const channelCount = audioBuffer.numberOfChannels;
  const channelData = Array.from({ length: channelCount }, (_, channel) => audioBuffer.getChannelData(channel));
  const duration = Math.max(0.1, endSeconds - startSeconds);
  const targetLength = Math.max(1, Math.ceil(duration * targetSampleRate));
  const pcm = new Int16Array(targetLength);
  const sourceStart = startSeconds * sourceSampleRate;
  const ratio = sourceSampleRate / targetSampleRate;

  for (let index = 0; index < targetLength; index += 1) {
    const sourcePosition = sourceStart + index * ratio;
    const leftIndex = Math.min(Math.floor(sourcePosition), audioBuffer.length - 1);
    const rightIndex = Math.min(leftIndex + 1, audioBuffer.length - 1);
    const interpolation = sourcePosition - leftIndex;
    let sample = 0;

    for (const data of channelData) {
      sample += data[leftIndex] * (1 - interpolation) + data[rightIndex] * interpolation;
    }

    sample = Math.max(-1, Math.min(1, sample / channelCount));
    pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcm.length * 2, true);

  let offset = 44;
  for (const sample of pcm) {
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function getAudioContextConstructor() {
  const browserWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const AudioContextConstructor = browserWindow.AudioContext || browserWindow.webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new ClientError("Ce navigateur ne prend pas en charge le decodage audio.");
  }

  return AudioContextConstructor;
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function baseName(filename: string) {
  return filename.replace(/\.[^/.]+$/, "") || "audio";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
