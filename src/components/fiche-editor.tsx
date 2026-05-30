"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  FINAL_FIELDS,
  HEADER_FIELDS,
  OFFICIAL_DEROULEMENT_COLUMNS,
  PLANNING_FIELDS,
  getExtraSections,
  normaliseDeroulement,
  readField,
  setContentField,
  setDeroulement,
  valueToText
} from "@/lib/fiche-utils";
import type { DeroulementRow, FicheContenu } from "@/lib/types";

function emptyRow(): DeroulementRow {
  return {
    etape: "",
    duree: "",
    activites_enseignant: "",
    activites_apprenants: "",
    consignes: "",
    resultats_attendus: "",
    evaluation: ""
  };
}

export function FicheEditor({
  contenu,
  onChange
}: {
  contenu: FicheContenu;
  onChange: (next: FicheContenu) => void;
}) {
  const rows = normaliseDeroulement(contenu);
  const extras = getExtraSections(contenu);

  function updateField(key: string, value: string) {
    onChange(setContentField(contenu, key, value));
  }

  function updateRow(index: number, key: keyof DeroulementRow, value: string) {
    const nextRows = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row));
    onChange(setDeroulement(contenu, nextRows));
  }

  function addRow() {
    onChange(setDeroulement(contenu, [...rows, emptyRow()]));
  }

  function removeRow(index: number) {
    onChange(setDeroulement(contenu, rows.filter((_, rowIndex) => rowIndex !== index)));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-stone-100 bg-white p-5 shadow-doux">
        <h2 className="mb-4 text-lg font-black text-encre">Informations générales</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {HEADER_FIELDS.map((field) => (
            <label key={field.key} className="text-sm font-semibold text-encre">
              {field.label}
              <input
                className="champ mt-1"
                value={valueToText(readField(contenu, field.key))}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-stone-100 bg-white p-5 shadow-doux">
        <h2 className="mb-4 text-lg font-black text-encre">Éléments de planification</h2>
        <div className="grid gap-4">
          {PLANNING_FIELDS.map((field) => (
            <label key={field.key} className="text-sm font-semibold text-encre">
              {field.label}
              <textarea
                className="champ mt-1"
                value={valueToText(readField(contenu, field.key))}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-stone-100 bg-white p-5 shadow-doux">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-encre">Déroulement</h2>
          <button type="button" onClick={addRow} className="bouton-secondaire">
            <Plus size={16} aria-hidden="true" />
            Ajouter une ligne
          </button>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div key={index} className="rounded-xl border border-stone-100 bg-ivoire/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-brun">Ligne {index + 1}</p>
                <button type="button" onClick={() => removeRow(index)} className="bouton-danger px-3 py-1.5">
                  <Trash2 size={15} aria-hidden="true" />
                  Retirer
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {OFFICIAL_DEROULEMENT_COLUMNS.map((column) => (
                  <label key={column.key} className="text-sm font-semibold text-encre">
                    {column.label}
                    <textarea
                      className="champ mt-1"
                      value={row[column.key]}
                      onChange={(event) => updateRow(index, column.key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-100 bg-ivoire/70 p-5 text-center text-sm text-brun">
              Aucune ligne de déroulement. Ajoutez une ligne pour compléter le tableau pédagogique.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-stone-100 bg-white p-5 shadow-doux">
        <h2 className="mb-4 text-lg font-black text-encre">Consignes et résultats attendus</h2>
        <div className="grid gap-4">
          {FINAL_FIELDS.map((field) => (
            <label key={field.key} className="text-sm font-semibold text-encre">
              {field.label}
              <textarea
                className="champ mt-1"
                value={valueToText(readField(contenu, field.key))}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      {extras.length > 0 ? (
        <section className="rounded-xl border border-stone-100 bg-white p-5 shadow-doux">
          <h2 className="mb-4 text-lg font-black text-encre">Champs reçus non classés</h2>
          <div className="grid gap-4">
            {extras.map((section) => (
              <label key={section.key} className="text-sm font-semibold text-encre">
                {section.label}
                <textarea
                  className="champ mt-1"
                  value={valueToText(section.value)}
                  onChange={(event) => updateField(section.key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
