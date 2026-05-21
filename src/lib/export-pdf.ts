import {
  DEROULEMENT_COLUMNS,
  HEADER_FIELDS,
  PLANNING_FIELDS,
  getExtraSections,
  normaliseDeroulement,
  readField,
  valueToText
} from "@/lib/fiche-utils";
import type { FicheRecord } from "@/lib/types";

type PdfLine = {
  text: string;
  size?: number;
  bold?: boolean;
  gapBefore?: number;
  indent?: number;
};
type PdfLineOptions = Omit<PdfLine, "text">;

function normalizeText(value: string): string {
  return (value || " ")
    .replace(/\u00a0/g, " ")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[•◦▪]/g, "-")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/€/g, "EUR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
}

function escapePdfString(value: string): string {
  return normalizeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxLength: number): string[] {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [" "];
}

function pushWrappedLine(lines: PdfLine[], text: string, options: PdfLineOptions = {}, maxLength = 92) {
  wrapText(text, maxLength).forEach((line, index) => {
    lines.push({
      ...options,
      text: line,
      gapBefore: index === 0 ? options.gapBefore : 0
    });
  });
}

function buildLines(fiche: FicheRecord): PdfLine[] {
  const lines: PdfLine[] = [];

  pushWrappedLine(lines, "Fiche pedagogique", { size: 18, bold: true }, 60);
  pushWrappedLine(lines, fiche.titre, { size: 12, gapBefore: 8 }, 76);

  lines.push({ text: "Informations generales", size: 12, bold: true, gapBefore: 16 });
  HEADER_FIELDS.forEach((field) => {
    pushWrappedLine(lines, `${field.label} : ${valueToText(readField(fiche.contenu_json, field.key))}`, {
      size: 10
    });
  });

  lines.push({ text: "Elements de planification", size: 12, bold: true, gapBefore: 14 });
  PLANNING_FIELDS.forEach((field) => {
    pushWrappedLine(lines, `${field.label} : ${valueToText(readField(fiche.contenu_json, field.key))}`, {
      size: 10
    });
  });

  lines.push({ text: "Grand tableau pedagogique", size: 12, bold: true, gapBefore: 14 });
  normaliseDeroulement(fiche.contenu_json).forEach((row, index) => {
    lines.push({ text: `Etape ${index + 1}`, size: 11, bold: true, gapBefore: index === 0 ? 4 : 10 });
    DEROULEMENT_COLUMNS.forEach((column) => {
      pushWrappedLine(lines, `${column.label} : ${row[column.key]}`, { size: 9, indent: 12 }, 86);
    });
  });

  const extras = getExtraSections(fiche.contenu_json);
  if (extras.length) {
    lines.push({ text: "Autres informations", size: 12, bold: true, gapBefore: 14 });
    extras.forEach((section) => {
      pushWrappedLine(lines, `${section.label} : ${valueToText(section.value)}`, { size: 10 }, 88);
    });
  }

  return lines;
}

function paginate(lines: PdfLine[]): string[] {
  const pages: string[] = [];
  const commands: string[] = [];
  let y = 800;

  function flushPage() {
    if (commands.length) {
      pages.push(commands.join("\n"));
      commands.length = 0;
    }
    y = 800;
  }

  lines.forEach((line) => {
    const size = line.size ?? 10;
    y -= line.gapBefore ?? 0;
    if (y < 52) {
      flushPage();
    }

    const font = line.bold ? "F2" : "F1";
    const x = 50 + (line.indent ?? 0);
    commands.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfString(line.text)}) Tj ET`);
    y -= size + 6;
  });

  flushPage();
  return pages.length ? pages : ["BT /F1 10 Tf 50 800 Td (Fiche pedagogique) Tj ET"];
}

function createPdf(pageStreams: string[]): Buffer {
  const objects: string[] = [
    "",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  ];
  const kids: string[] = [];

  pageStreams.forEach((stream) => {
    const contentObjectNumber = objects.length + 1;
    objects.push(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);

    const pageObjectNumber = objects.length + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
    kids.push(`${pageObjectNumber} 0 R`);
  });

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${kids.length} >>`;

  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "latin1"));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(chunks.join(""), "latin1");
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(chunks.join(""), "latin1");
}

export async function buildFichePdf(fiche: FicheRecord): Promise<Buffer> {
  return createPdf(paginate(buildLines(fiche)));
}
