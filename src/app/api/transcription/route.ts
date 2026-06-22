import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 1800;

const OPENAI_UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;
const DIRECT_UPLOAD_LIMIT_BYTES = 24 * 1024 * 1024;
const DEFAULT_SEGMENT_SECONDS = 10 * 60;
const SUPPORTED_EXTENSIONS = new Set(["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg", "flac"]);

type SegmentResult = {
  index: number;
  filename: string;
  bytes: number;
  text: string;
};

type TranscriptionOptions = {
  apiKey: string;
  model: string;
  language: string;
  prompt: string;
};

class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly details?: string
  ) {
    super(message);
  }
}

export async function POST(request: NextRequest) {
  let workDir: string | undefined;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new HttpError("Ajoutez un fichier audio valide.", 400);
    }

    validateAudioFile(file);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new HttpError("Configurez OPENAI_API_KEY dans .env.local avant de lancer la transcription.", 400);
    }

    const options: TranscriptionOptions = {
      apiKey,
      model: process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-transcribe",
      language: readString(formData.get("language"), "fr"),
      prompt: readString(formData.get("prompt"), "")
    };
    const segmentSeconds = readSegmentSeconds(formData.get("segmentSeconds"));
    const startedAt = new Date();
    let segments: SegmentResult[] = [];
    let usedChunking = false;

    if (file.size <= DIRECT_UPLOAD_LIMIT_BYTES) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await transcribeBuffer(buffer, file.name, file.type || "audio/mpeg", options);
      segments = [
        {
          index: 1,
          filename: file.name,
          bytes: file.size,
          text
        }
      ];
    } else {
      usedChunking = true;
      const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
      workDir = await mkdtemp(path.join(tmpdir(), "audio-transcription-"));
      await mkdir(workDir, { recursive: true });

      const extension = getExtension(file.name) || "audio";
      const inputPath = path.join(workDir, `source-${randomUUID()}.${extension}`);
      await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

      const outputPattern = path.join(workDir, "segment-%03d.mp3");
      await splitAudioWithFfmpeg(ffmpegPath, inputPath, outputPattern, segmentSeconds);

      const segmentFiles = (await readdir(workDir))
        .filter((name) => name.startsWith("segment-") && name.endsWith(".mp3"))
        .sort();

      if (segmentFiles.length === 0) {
        throw new HttpError("Aucun segment audio n'a pu etre cree.", 422);
      }

      segments = [];
      for (const [index, filename] of segmentFiles.entries()) {
        const segmentPath = path.join(workDir, filename);
        const segmentBuffer = await readFile(segmentPath);

        if (segmentBuffer.byteLength > OPENAI_UPLOAD_LIMIT_BYTES) {
          throw new HttpError(
            "Un segment depasse encore 25 MB. Relancez avec des segments plus courts.",
            422,
            `${filename}: ${formatBytes(segmentBuffer.byteLength)}`
          );
        }

        const text = await transcribeBuffer(segmentBuffer, filename, "audio/mpeg", options);
        segments.push({
          index: index + 1,
          filename,
          bytes: segmentBuffer.byteLength,
          text
        });
      }
    }

    const cleanSegments = segments.map((segment) => ({
      ...segment,
      text: segment.text.trim()
    }));
    const text = cleanSegments.map((segment) => segment.text).filter(Boolean).join("\n\n");

    return NextResponse.json({
      filename: file.name,
      model: options.model,
      language: options.language || "auto",
      usedChunking,
      segmentSeconds: usedChunking ? segmentSeconds : null,
      segmentCount: cleanSegments.length,
      sourceBytes: file.size,
      text,
      segments: cleanSegments,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
    }

    return NextResponse.json(
      {
        error: "La transcription a echoue.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true });
    }
  }
}

function validateAudioFile(file: File) {
  const extension = getExtension(file.name);

  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    throw new HttpError(
      "Format audio non pris en charge. Utilisez mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg ou flac.",
      400
    );
  }
}

function readString(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.trim();
}

function readSegmentSeconds(value: FormDataEntryValue | null) {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : DEFAULT_SEGMENT_SECONDS;
  if (!Number.isFinite(parsed)) {
    return DEFAULT_SEGMENT_SECONDS;
  }
  return Math.min(Math.max(parsed, 180), 15 * 60);
}

function getExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension && extension !== filename.toLowerCase() ? extension : "";
}

function splitAudioWithFfmpeg(
  ffmpegPath: string,
  inputPath: string,
  outputPattern: string,
  segmentSeconds: number
) {
  return runCommand(
    ffmpegPath,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputPath,
      "-map",
      "0:a:0",
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-b:a",
      "48k",
      "-f",
      "segment",
      "-segment_time",
      String(segmentSeconds),
      "-reset_timestamps",
      "1",
      outputPattern
    ],
    30 * 60 * 1000
  ).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT") || message.includes("not recognized") || message.includes("not found")) {
      throw new HttpError(
        "Installez ffmpeg pour transcrire un fichier de plus de 25 MB.",
        422,
        "Sur Windows, installez ffmpeg puis relancez le serveur Next.js, ou renseignez FFMPEG_PATH dans .env.local."
      );
    }

    throw new HttpError("Le decoupage audio avec ffmpeg a echoue.", 422, message);
  });
}

function runCommand(command: string, args: string[], timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stderr = "";
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      callback();
    };

    const timer = setTimeout(() => {
      child.kill();
      finish(() => reject(new Error("La commande ffmpeg a depasse le delai maximal.")));
    }, timeoutMs);

    child.stderr.on("data", (chunk: Buffer) => {
      stderr = `${stderr}${chunk.toString()}`.slice(-4000);
    });

    child.on("error", (error) => {
      finish(() => reject(error));
    });

    child.on("close", (code) => {
      finish(() => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderr || `ffmpeg s'est termine avec le code ${code}.`));
      });
    });
  });
}

async function transcribeBuffer(buffer: Buffer, filename: string, mimeType: string, options: TranscriptionOptions) {
  const formData = new FormData();
  formData.append("model", options.model);
  formData.append("file", new Blob([toArrayBuffer(buffer)], { type: mimeType }), filename);
  formData.append("response_format", "text");

  if (options.language && options.language !== "auto") {
    formData.append("language", options.language);
  }

  if (options.prompt) {
    formData.append("prompt", options.prompt);
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`
    },
    body: formData
  });
  const body = await response.text();

  if (!response.ok) {
    throw new HttpError("OpenAI a refuse la transcription d'un segment.", response.status, extractOpenAiError(body));
  }

  return body;
}

function toArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

function extractOpenAiError(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return parsed.error?.message || body.slice(0, 500);
  } catch {
    return body.slice(0, 500);
  }
}

function formatBytes(bytes: number) {
  const megaBytes = bytes / 1024 / 1024;
  return `${megaBytes.toFixed(1)} MB`;
}
