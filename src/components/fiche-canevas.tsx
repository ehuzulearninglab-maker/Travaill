import {
  DEROULEMENT_COLUMNS,
  HEADER_FIELDS,
  PLANNING_FIELDS,
  getExtraSections,
  getFinalSections,
  normaliseDeroulement,
  readField,
  valueToText
} from "@/lib/fiche-utils";
import type { FicheContenu } from "@/lib/types";

function TextBlock({ value }: { value: string }) {
  return <div className="texte-canevas min-h-[18px] leading-snug">{value || "\u00a0"}</div>;
}

function FieldCell({ fieldKey, label, contenu }: { fieldKey: string; label: string; contenu: FicheContenu }) {
  return (
    <td>
      <span className="libelle-canevas">{label}</span>
      <TextBlock value={valueToText(readField(contenu, fieldKey))} />
    </td>
  );
}

export function FicheCanevas({ contenu }: { contenu: FicheContenu }) {
  const deroulement = normaliseDeroulement(contenu);
  const ficheDe = valueToText(readField(contenu, "fiche_de")) || "Fiche pédagogique";
  const finalSections = [
    ...getFinalSections(contenu),
    ...getExtraSections(contenu).map((section) => ({
      key: section.key,
      label: section.label,
      value: valueToText(section.value)
    }))
  ];

  return (
    <div className="canevas-scroll">
      <article className="feuille-pedagogique fiche-a4">
        <header className="entete-fiche">
          <p>Canevas pédagogique</p>
          <h1>Fiche de {ficheDe}</h1>
        </header>

        <section aria-label="Identification de la fiche">
          <table className="table-canevas table-identification">
            <tbody>
              <tr>
                {HEADER_FIELDS.slice(0, 4).map((field) => (
                  <FieldCell key={field.key} fieldKey={field.key} label={field.label} contenu={contenu} />
                ))}
              </tr>
              <tr>
                {HEADER_FIELDS.slice(4, 8).map((field) => (
                  <FieldCell key={field.key} fieldKey={field.key} label={field.label} contenu={contenu} />
                ))}
              </tr>
            </tbody>
          </table>
        </section>

        <section className="bloc-canevas">
          <h2>Éléments de planification</h2>
          <table className="table-canevas table-planification">
            <tbody>
              {PLANNING_FIELDS.map((field) => (
                <tr key={field.key}>
                  <th>{field.label}</th>
                  <td>
                    <TextBlock value={valueToText(readField(contenu, field.key))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bloc-canevas">
          <h2>Déroulement</h2>
          <table className="table-canevas table-deroulement">
            <thead>
              <tr>
                {DEROULEMENT_COLUMNS.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deroulement.length > 0 ? (
                deroulement.map((row, index) => (
                  <tr key={`${row.etape || "ligne"}-${index}`}>
                    {DEROULEMENT_COLUMNS.map((column) => (
                      <td key={column.key}>
                        <TextBlock value={row[column.key]} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={DEROULEMENT_COLUMNS.length} className="cellule-vide">
                    Aucun déroulement détaillé n'a été reçu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {finalSections.length > 0 ? (
          <section className="bloc-canevas">
            <table className="table-canevas table-final">
              <tbody>
                {finalSections.map((section) => (
                  <tr key={section.key}>
                    <th>{section.label}</th>
                    <td>
                      <TextBlock value={section.value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </article>
    </div>
  );
}
