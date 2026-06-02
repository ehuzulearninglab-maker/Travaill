"use client";

import { useState } from "react";
import { KeyRound, Save, Trash2 } from "lucide-react";

type GeminiAdminStatus = {
  actif: boolean;
  modele: string;
  source: "admin" | "environnement" | "absent";
  apercu_cle?: string;
  date_modification?: string;
  stockage?: "postgres" | "temporaire";
  stockage_persistant?: boolean;
  avertissement?: string;
};

const sourceLabels: Record<GeminiAdminStatus["source"], string> = {
  admin: "Clé enregistrée dans l'administration",
  environnement: "Clé configurée sur Vercel",
  absent: "Aucune clé configurée"
};

export function GeminiSettingsClient({ initialStatus }: { initialStatus: GeminiAdminStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [model, setModel] = useState(initialStatus.modele);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveSettings(clearKey = false) {
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/gemini/parametres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gemini_model: model,
        effacer_cle: clearKey,
        ...(clearKey || !apiKey.trim() ? {} : { gemini_api_key: apiKey.trim() })
      })
    });

    const data = (await response.json()) as { message?: string; parametres?: GeminiAdminStatus };
    setSaving(false);

    if (!response.ok || !data.parametres) {
      setMessage(data.message || "Les paramètres Gemini n'ont pas pu être enregistrés.");
      return;
    }

    setStatus(data.parametres);
    setModel(data.parametres.modele);
    setApiKey("");
    setMessage(data.message || (clearKey ? "Clé Gemini retirée." : "Paramètres Gemini enregistrés."));
  }

  return (
    <section className="rounded-xl border border-stone-100 bg-white p-5 shadow-doux">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-encre">Clé API Gemini</h2>
          <p className="mt-1 max-w-2xl text-sm text-brun">
            Seuls les administrateurs voient cet espace. La clé n'est jamais affichée entièrement après enregistrement.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${
            status.actif ? "bg-ciel text-sauge" : "bg-red-50 text-red-700"
          }`}
        >
          <KeyRound size={16} aria-hidden="true" />
          {status.actif ? "Clé active" : "Clé absente"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="text-sm font-bold text-encre">Nouvelle clé API</span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={status.apercu_cle || "AIza..."}
            className="champ mt-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-encre">Modèle</span>
          <input
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="champ mt-2"
          />
        </label>

        <div className="flex items-end gap-2">
          <button type="button" className="bouton-primaire" disabled={saving} onClick={() => saveSettings(false)}>
            <Save size={16} aria-hidden="true" />
            Enregistrer
          </button>
          <button type="button" className="bouton-secondaire" disabled={saving} onClick={() => saveSettings(true)}>
            <Trash2 size={16} aria-hidden="true" />
            Retirer
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-ivoire px-4 py-3 text-sm text-encre">
        <p>
          <span className="font-bold text-encre">Source :</span> {sourceLabels[status.source]}
        </p>
        <p>
          <span className="font-bold text-encre">Clé :</span> {status.apercu_cle || "non configurée"}
        </p>
        <p>
          <span className="font-bold text-encre">Base utilisée :</span>{" "}
          {status.stockage_persistant ? "PostgreSQL / Supabase" : "mémoire temporaire"}
        </p>
      </div>

      {status.avertissement ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {status.avertissement}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm font-bold text-sauge">{message}</p> : null}
    </section>
  );
}
