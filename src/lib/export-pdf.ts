import {
  HEADER_FIELDS,
  OFFICIAL_DEROULEMENT_COLUMNS,
  PLANNING_FIELDS,
  getExtraSections,
  normaliseOfficialDeroulement,
  readField,
  valueToText
} from "@/lib/fiche-utils";
import type { FicheRecord } from "@/lib/types";

type PdfCell = {
  text: string;
  bold?: boolean;
  fill?: boolean;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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
    .replace(/[^\x09\x0a\x0d\x20-\xff]/g, "");
}

function escapePdfString(value: string): string {
  return normalizeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxLength: number): string[] {
  const lines: string[] = [];

  normalizeText(text)
    .split(/\n+/)
    .forEach((paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
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
  });

  return lines.length ? lines : [" "];
}

function estimateLines(cell: PdfCell, width: number): string[] {
  return wrapText(cell.text, Math.max(10, Math.floor(width / 4.4)));
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
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
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

function renderFiche(fiche: FicheRecord): string[] {
  const pages: string[] = [];
  let commands: string[] = [];
  let y = PAGE_HEIGHT - MARGIN;

  function flushPage() {
    if (commands.length > 0) {
      pages.push(commands.join("\n"));
    }
    commands = [];
    y = PAGE_HEIGHT - MARGIN;
  }

  function ensureSpace(height: number) {
    if (y - height < MARGIN) {
      flushPage();
    }
  }

  function addText(text: string, x: number, top: number, size = 9, bold = false, maxLength = 95) {
    const font = bold ? "F2" : "F1";
    wrapText(text, maxLength).slice(0, 12).forEach((line, index) => {
      commands.push(`BT /${font} ${size} Tf ${x} ${top - index * (size + 3)} Td (${escapePdfString(line)}) Tj ET`);
    });
  }

  function addTitle(text: string, size: number, gap = 10) {
    ensureSpace(size + gap + 8);
    commands.push(`BT /F2 ${size} Tf ${MARGIN} ${y} Td (${escapePdfString(text)}) Tj ET`);
    y -= size + gap;
  }

  function drawCell(
    x: number,
    top: number,
    width: number,
    height: number,
    cell: PdfCell,
    size = 8,
    linesOverride?: string[]
  ) {
    if (cell.fill) {
      commands.push(`q 0.94 0.88 0.78 rg ${x} ${top - height} ${width} ${height} re f Q`);
    }
    commands.push(`${x} ${top - height} ${width} ${height} re S`);
    const lines = linesOverride ?? estimateLines(cell, width - 8);
    const font = cell.bold ? "F2" : "F1";
    lines.forEach((line, index) => {
      commands.push(`BT /${font} ${size} Tf ${x + 4} ${top - 12 - index * (size + 3)} Td (${escapePdfString(line)}) Tj ET`);
    });
  }

  function addTable(rows: PdfCell[][], widths: number[], size = 8) {
    rows.forEach((row) => {
      const rowLines = row.map((cell, index) => estimateLines(cell, widths[index] - 8));
      const maxLineCount = Math.max(...rowLines.map((lines) => lines.length), 1);
      let lineOffset = 0;

      while (lineOffset < maxLineCount) {
        if (y - 36 < MARGIN) {
          flushPage();
        }

        const availableLines = Math.max(1, Math.floor((y - MARGIN - 12) / (size + 3)));
        const chunkLineCount = Math.min(maxLineCount - lineOffset, availableLines);
        const height = Math.max(24, chunkLineCount * (size + 3) + 12);
        ensureSpace(height + 4);

        let x = MARGIN;
        row.forEach((cell, index) => {
          const lines = rowLines[index].slice(lineOffset, lineOffset + chunkLineCount);
          drawCell(x, y, widths[index], height, cell, size, lines.length ? lines : [" "]);
          x += widths[index];
        });
        y -= height;
        lineOffset += chunkLineCount;
      }
    });
    y -= 14;
  }

  commands.push("0.13 0.11 0.08 RG 0.6 w");
  addText("CANEVAS PEDAGOGIQUE", 224, y, 8, true, 40);
  y -= 18;
  addText(`Fiche de ${valueToText(readField(fiche.contenu_json, "fiche_de")) || fiche.matiere}`, 190, y, 16, true, 50);
  y -= 18;
  commands.push(`${MARGIN} ${y} m ${MARGIN + CONTENT_WIDTH} ${y} l S`);
  y -= 14;

  const identificationRows = [0, 4].map((start) =>
    HEADER_FIELDS.slice(start, start + 4).map((field) => ({
      text: `${field.label.toUpperCase()}\n${valueToText(readField(fiche.contenu_json, field.key))}`
    }))
  );
  addTable(identificationRows, [CONTENT_WIDTH / 4, CONTENT_WIDTH / 4, CONTENT_WIDTH / 4, CONTENT_WIDTH / 4], 8);

  addTitle("Elements de planification", 11, 8);
  addTable(
    PLANNING_FIELDS.map((field) => [
      { text: field.label, bold: true, fill: true },
      { text: valueToText(readField(fiche.contenu_json, field.key)) }
    ]),
    [168, CONTENT_WIDTH - 168],
    8
  );

  addTitle("Deroulement", 11, 8);
  addTable(
    [
      OFFICIAL_DEROULEMENT_COLUMNS.map((column) => ({ text: column.label, bold: true, fill: true })),
      ...normaliseOfficialDeroulement(fiche.contenu_json).map((row) =>
        OFFICIAL_DEROULEMENT_COLUMNS.map((column) => ({ text: row[column.key] }))
      ),
      ...getExtraSections(fiche.contenu_json).map((section) => [
        { text: `${section.label}\n${valueToText(section.value)}` },
        { text: "" }
      ])
    ],
    [356, CONTENT_WIDTH - 356],
    8
  );

  flushPage();
  return pages;
}

export async function buildFichePdf(fiche: FicheRecord): Promise<Buffer> {
  return createPdf(renderFiche(fiche));
}
