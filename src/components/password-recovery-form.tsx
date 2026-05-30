"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    await fetch("/api/auth/recuperation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    setLoading(false);
    setDone(true);
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-md border border-stone-100 bg-white p-6 shadow-doux">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sauge text-white">
          <MailCheck size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-encre">Récupération</h1>
          <p className="text-sm text-brun">Indiquez le courriel lié à votre compte.</p>
        </div>
      </div>

      <label className="mb-5 block text-sm font-semibold text-encre">
        Courriel
        <input
          className="champ mt-1"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      {done ? (
        <p className="mb-4 rounded-md bg-ciel px-3 py-2 text-sm font-medium text-sauge">
          Si un compte correspond à ce courriel, une procédure de réinitialisation pourra être envoyée.
        </p>
      ) : null}

      <button className="bouton-primaire w-full" disabled={loading}>
        {loading ? "Traitement..." : "Demander la récupération"}
      </button>

      <p className="mt-5 text-center text-sm text-brun">
        <Link href="/connexion" className="font-bold text-sauge hover:underline">
          Revenir à la connexion
        </Link>
      </p>
    </form>
  );
}
