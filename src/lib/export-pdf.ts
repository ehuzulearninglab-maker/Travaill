import PDFDocument from "pdfkit";
import {
  DEROULEMENT_COLUMNS,
  HEADER_FIELDS,
  PLANNING_FIELDS,
  normaliseDeroulement,
  readField,
  valueToText
} from "@/lib/fiche-utils";
import type { FicheRecord } from "@/lib/types";

type PdfKitDoc = InstanceType<typeof PDFDocument>;

function safePdfText(value: string): string {
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
    .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, "");
}

function addWrappedCell(
  doc: PdfKitDoc,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { bold?: boolean; fill?: string } = {}
) {
  doc.rect(x, y, width, height).fillAndStroke(options.fill ?? "#ffffff", "#3c3126");
  doc.fillColor("#181713").font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(8);
  doc.text(safePdfText(text), x + 4, y + 5, {
    width: width - 8,
    height: height - 8,
    ellipsis: true
  });
}

function ensureSpace(doc: PdfKitDoc, y: number, needed: number): number {
  if (y + needed > doc.page.height - 48) {
    doc.addPage();
    return 42;
  }
  return y;
}

export async function buildFichePdf(fiche: FicheRecord): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(16).fillColor("#181713").text("Fiche pédagogique", {
      align: "center"
    });
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10).text(safePdfText(fiche.titre), { align: "center" });
    doc.moveDown(1);

    const pageWidth = doc.page.width - 72;
    let y = doc.y;
    const metaCellWidth = pageWidth / 4;
    HEADER_FIELDS.forEach((field, index) => {
      const x = 36 + (index % 4) * metaCellWidth;
      if (index > 0 && index % 4 === 0) {
        y += 42;
      }
      addWrappedCell(doc, field.label, x, y, metaCellWidth, 18, { bold: true, fill: "#efe3cf" });
      addWrappedCell(
        doc,
        valueToText(readField(fiche.contenu_json, field.key)),
        x,
        y + 18,
        metaCellWidth,
        24
      );
    });
    y += 56;

    y = ensureSpace(doc, y, 34);
    doc.font("Helvetica-Bold").fontSize(11).text("Éléments de planification", 36, y);
    y += 18;
    PLANNING_FIELDS.forEach((field) => {
      const value = valueToText(readField(fiche.contenu_json, field.key));
      const valueHeight = Math.max(
        30,
        doc.heightOfString(safePdfText(value), { width: pageWidth * 0.66 - 10 }) + 14
      );
      y = ensureSpace(doc, y, valueHeight);
      addWrappedCell(doc, field.label, 36, y, pageWidth * 0.34, valueHeight, {
        bold: true,
        fill: "#f6eddc"
      });
      addWrappedCell(doc, value, 36 + pageWidth * 0.34, y, pageWidth * 0.66, valueHeight);
      y += valueHeight;
    });

    y += 18;
    y = ensureSpace(doc, y, 60);
    doc.font("Helvetica-Bold").fontSize(11).text("Grand tableau pédagogique", 36, y);
    y += 18;

    const widths = [68, 45, 92, 92, 74, 92, 60];
    DEROULEMENT_COLUMNS.forEach((column, index) => {
      const x = 36 + widths.slice(0, index).reduce((sum, width) => sum + width, 0);
      addWrappedCell(doc, column.label, x, y, widths[index], 34, { bold: true, fill: "#efe3cf" });
    });
    y += 34;

    normaliseDeroulement(fiche.contenu_json).forEach((row) => {
      const values = DEROULEMENT_COLUMNS.map((column) => row[column.key]);
      const height = Math.max(
        46,
        ...values.map((value, index) => doc.heightOfString(safePdfText(value), { width: widths[index] - 8 }) + 14)
      );
      y = ensureSpace(doc, y, height);
      values.forEach((value, index) => {
        const x = 36 + widths.slice(0, index).reduce((sum, width) => sum + width, 0);
        addWrappedCell(doc, value, x, y, widths[index], height);
      });
      y += height;
    });

    doc.end();
  });
}
