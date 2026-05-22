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
  FINAL_FIELDS,
  HEADER_FIELDS,
  PLANNING_FIELDS,
  getExtraSections,
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

function labeledCell(label: string, value: string): TableCell {
  return new TableCell({
    children: [paragraph(label.toUpperCase(), true), paragraph(value)]
  });
}

function cell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [paragraph(text, bold)]
  });
}

export async function buildFicheWord(fiche: FicheRecord): Promise<Buffer> {
  const contenu = fiche.contenu_json;

  const identificationRows = [0, 4].map(
    (start) =>
      new TableRow({
        children: HEADER_FIELDS.slice(start, start + 4).map((field) =>
          labeledCell(field.label, valueToText(readField(contenu, field.key)))
        )
      })
  );

  const planningRows = PLANNING_FIELDS.map(
    (field) =>
      new TableRow({
        children: [cell(field.label, true), cell(valueToText(readField(contenu, field.key)))]
      })
  );

  const deroulementRows = [
    new TableRow({
      children: DEROULEMENT_COLUMNS.map((column) => cell(column.label, true))
    }),
    ...normaliseDeroulement(contenu).map(
      (row) =>
        new TableRow({
          children: DEROULEMENT_COLUMNS.map((column) => cell(row[column.key]))
        })
    )
  ];

  const finalRows = FINAL_FIELDS.map((field) => ({
    field,
    value: valueToText(readField(contenu, field.key))
  }))
    .filter((item) => item.value.trim().length > 0)
    .map(
      (item) =>
        new TableRow({
          children: [cell(item.field.label, true), cell(item.value)]
        })
    );
  const extraRows = getExtraSections(contenu).map(
    (section) =>
      new TableRow({
        children: [cell(section.label, true), cell(valueToText(section.value))]
      })
  );

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "CANEVAS PÉDAGOGIQUE", bold: true, size: 18 })]
    }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Fiche de ${valueToText(readField(contenu, "fiche_de")) || fiche.matiere}` })]
    }),
    new Paragraph({ children: [] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: identificationRows
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
      children: [new TextRun({ text: "Déroulement" })]
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: deroulementRows
    })
  ];

  if (finalRows.length > 0 || extraRows.length > 0) {
    children.push(
      new Paragraph({ children: [] }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [...finalRows, ...extraRows]
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  return Packer.toBuffer(doc);
}
