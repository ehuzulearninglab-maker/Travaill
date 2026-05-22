import {
  HEADER_FIELDS,
  OFFICIAL_DEROULEMENT_COLUMNS,
  PLANNING_FIELDS,
  getExtraSections,
  normaliseOfficialDeroulement,
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
  const deroulement = normaliseOfficialDeroulement(contenu);
  const ficheDe = valueToText(readField(contenu, "fiche_de")) || "Fiche pédagogique";
  const extraSections = getExtraSections(contenu).map((section) => ({
    key: section.key,
    label: section.label,
    value: valueToText(section.value)
  }));

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
          <h2 className="titre-deroulement">Déroulement</h2>
          <table className="table-canevas table-deroulement">
            <thead>
              <tr>
                {OFFICIAL_DEROULEMENT_COLUMNS.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deroulement.length > 0 ? (
                deroulement.map((row, index) => (
                  <tr key={`deroulement-${index}`}>
                    {OFFICIAL_DEROULEMENT_COLUMNS.map((column) => (
                      <td key={column.key}>
                        <TextBlock value={row[column.key]} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : extraSections.length === 0 ? (
                <tr>
                  <td colSpan={OFFICIAL_DEROULEMENT_COLUMNS.length} className="cellule-vide">
                    Aucun déroulement détaillé n'a été reçu.
                  </td>
                </tr>
              ) : null}
              {extraSections.map((section) => (
                <tr key={section.key}>
                  <td>
                    <TextBlock value={`${section.label}\n${section.value}`} />
                  </td>
                  <td>
                    <TextBlock value="" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </article>
    </div>
  );
}
