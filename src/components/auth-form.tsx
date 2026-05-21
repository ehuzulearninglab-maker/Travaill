"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, UserPlus } from "lucide-react";

export function AuthForm({ mode }: { mode: "connexion" | "inscription" }) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState(mode === "connexion" ? "enseignant@ehuzu.test" : "");
  const [password, setPassword] = useState(mode === "connexion" ? "enseignant-demo" : "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom,
        email,
        mot_de_passe: password
      })
    });

    const data = (await response.json()) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setMessage(data.message || "La demande n’a pas abouti.");
      return;
    }

    router.push("/tableau-de-bord");
    router.refresh();
  }

  const isRegister = mode === "inscription";

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-md border border-stone-200 bg-white p-6 shadow-doux">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sauge text-white">
          {isRegister ? <UserPlus size={20} aria-hidden="true" /> : <KeyRound size={20} aria-hidden="true" />}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-encre">{isRegister ? "Créer un compte" : "Connexion"}</h1>
          <p className="text-sm text-stone-600">
            {isRegister ? "Renseignez vos informations." : "Accédez à vos fiches pédagogiques."}
          </p>
        </div>
      </div>

      {isRegister ? (
        <label className="mb-4 block text-sm font-semibold text-stone-700">
          Nom
          <input className="champ mt-1" value={nom} onChange={(event) => setNom(event.target.value)} required />
        </label>
      ) : null}

      <label className="mb-4 block text-sm font-semibold text-stone-700">
        Courriel
        <input
          className="champ mt-1"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="mb-5 block text-sm font-semibold text-stone-700">
        Mot de passe
        <input
          className="champ mt-1"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {message ? <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}

      <button className="bouton-primaire w-full" disabled={loading}>
        <LogIn size={17} aria-hidden="true" />
        {loading ? "Traitement..." : isRegister ? "Créer le compte" : "Se connecter"}
      </button>
    </form>
  );
}
