"use client";

import type { FicheRecord } from "@/lib/types";

type ExportFormat = "pdf" | "word";

function extensionFor(format: ExportFormat): string {
  return format === "word" ? "docx" : "pdf";
}

function safeFileName(value: string, extension: string): string {
  const name = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return `${name || "fiche_pedagogique"}.${extension}`;
}

export async function telechargerFiche(fiche: FicheRecord, format: ExportFormat) {
  const extension = extensionFor(format);
  const response = await fetch(`/api/fiches/export/${format}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fiche })
  });

  if (!response.ok) {
    throw new Error("Export impossible pour le moment.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(fiche.titre, extension);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

