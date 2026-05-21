import {
  DEROULEMENT_COLUMNS,
  HEADER_FIELDS,
  PLANNING_FIELDS,
  getExtraSections,
  normaliseDeroulement,
  readField,
  valueToText
} from "@/lib/fiche-utils";
import type { FicheContenu } from "@/lib/types";

function TextBlock({ value }: { value: string }) {
  return <div className="texte-canevas min-h-6 text-sm leading-relaxed">{value || "\u00a0"}</div>;
}

export function FicheCanevas({ contenu }: { contenu: FicheContenu }) {
  const deroulement = normaliseDeroulement(contenu);
  const ficheDe = valueToText(readField(contenu, "fiche_de")) || "Fiche pédagogique";
  const extras = getExtraSections(contenu);

  return (
    <article className="feuille-pedagogique mx-auto w-full max-w-[1120px] rounded-md p-4 sm:p-7">
      <div className="mb-5 border-b-2 border-stone-800 pb-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brun">Canevas pédagogique</p>
        <h1 className="mt-2 text-2xl font-black text-encre sm:text-3xl">Fiche de {ficheDe}</h1>
      </div>

      <section aria-label="Informations générales" className="mb-6 overflow-x-auto">
        <table className="table-canevas min-w-[760px]">
          <tbody>
            {[0, 4].map((start) => (
              <tr key={start}>
                {HEADER_FIELDS.slice(start, start + 4).map((field) => (
                  <td key={field.key} className="w-1/4">
                    <span className="block text-xs font-bold uppercase text-stone-700">{field.label}</span>
                    <TextBlock value={valueToText(readField(contenu, field.key))} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-black text-encre">Éléments de planification</h2>
        <div className="overflow-x-auto">
          <table className="table-canevas min-w-[760px]">
            <tbody>
              {PLANNING_FIELDS.map((field) => (
                <tr key={field.key}>
                  <th className="w-[32%] text-left text-sm">{field.label}</th>
                  <td>
                    <TextBlock value={valueToText(readField(contenu, field.key))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-black text-encre">Grand tableau pédagogique</h2>
        <div className="overflow-x-auto">
          <table className="table-canevas min-w-[980px]">
            <thead>
              <tr>
                {DEROULEMENT_COLUMNS.map((column) => (
                  <th key={column.key} className="text-left text-xs">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deroulement.length > 0 ? (
                deroulement.map((row, index) => (
                  <tr key={`${row.etape}-${index}`}>
                    {DEROULEMENT_COLUMNS.map((column) => (
                      <td key={column.key} className="text-sm">
                        <TextBlock value={row[column.key]} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={DEROULEMENT_COLUMNS.length} className="text-center text-sm text-stone-500">
                    Aucun déroulement détaillé reçu pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {extras.length > 0 ? (
        <section>
          <h2 className="mb-2 text-lg font-black text-encre">Sections supplémentaires</h2>
          <div className="overflow-x-auto">
            <table className="table-canevas min-w-[760px]">
              <tbody>
                {extras.map((section) => (
                  <tr key={section.key}>
                    <th className="w-[32%] text-left text-sm">{section.label}</th>
                    <td>
                      <TextBlock value={valueToText(section.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </article>
  );
}
