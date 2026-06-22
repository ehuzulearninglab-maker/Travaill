import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_CHUNK_BYTES = 4.2 * 1024 * 1024;

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
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new HttpError("Segment audio manquant.", 400);
    }

    if (file.size > MAX_CHUNK_BYTES) {
      throw new HttpError("Segment trop lourd pour l'hebergement en ligne.", 413);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new HttpError("Configurez OPENAI_API_KEY dans les variables d'environnement du site.", 400);
    }

    const model = readString(formData.get("model"), process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-transcribe");
    const language = readString(formData.get("language"), "fr");
    const prompt = readString(formData.get("prompt"), "");
    const index = readString(formData.get("index"), "");

    const output = await transcribeChunk(file, {
      apiKey,
      model,
      language,
      prompt
    });

    return NextResponse.json({
      index,
      filename: file.name,
      bytes: file.size,
      model,
      text: output.trim()
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
    }

    return NextResponse.json(
      {
        error: "La transcription du segment a echoue.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function readString(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  return cleaned || fallback;
}

async function transcribeChunk(
  file: File,
  options: {
    apiKey: string;
    model: string;
    language: string;
    prompt: string;
  }
) {
  const body = new FormData();
  body.append("model", options.model);
  body.append("response_format", "text");
  body.append("file", file, file.name);

  if (options.language && options.language !== "auto") {
    body.append("language", options.language);
  }

  if (options.prompt) {
    body.append("prompt", options.prompt);
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`
    },
    body
  });
  const text = await response.text();

  if (!response.ok) {
    throw new HttpError("OpenAI a refuse un segment audio.", response.status, extractOpenAiError(text));
  }

  return text;
}

function extractOpenAiError(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return parsed.error?.message || body.slice(0, 500);
  } catch {
    return body.slice(0, 500);
  }
}
