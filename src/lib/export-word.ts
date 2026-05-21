import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";
import {
  DEROULEMENT_COLUMNS,
  HEADER_FIELDS,
  PLANNING_FIELDS,
  normaliseDeroulement,
  readField,
  valueToText
} from "@/lib/fiche-utils";
import type { FicheRecord } from "@/lib/types";

function paragraph(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text || " ", bold })]
  });
}

function cell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [paragraph(text, bold)]
  });
}

export async function buildFicheWord(fiche: FicheRecord): Promise<Buffer> {
  const metaRows: TableRow[] = [];
  for (let index = 0; index < HEADER_FIELDS.length; index += 2) {
    const first = HEADER_FIELDS[index];
    const second = HEADER_FIELDS[index + 1];
    metaRows.push(
      new TableRow({
        children: [
          cell(first.label, true),
          cell(valueToText(readField(fiche.contenu_json, first.key))),
          cell(second?.label ?? "", true),
          cell(second ? valueToText(readField(fiche.contenu_json, second.key)) : "")
        ]
      })
    );
  }

  const planningRows = PLANNING_FIELDS.map(
    (field) =>
      new TableRow({
        children: [
          cell(field.label, true),
          cell(valueToText(readField(fiche.contenu_json, field.key)))
        ]
      })
  );

  const deroulementRows = [
    new TableRow({
      children: DEROULEMENT_COLUMNS.map((column) => cell(column.label, true))
    }),
    ...normaliseDeroulement(fiche.contenu_json).map(
      (row) =>
        new TableRow({
          children: DEROULEMENT_COLUMNS.map((column) => cell(row[column.key]))
        })
    )
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Fiche pédagogique" })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: fiche.titre })]
          }),
          new Paragraph({ children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: metaRows
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Éléments de planification" })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: planningRows
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Grand tableau pédagogique" })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: deroulementRows
          })
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}
