export default function PolitiqueConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl rounded-md border border-stone-100 bg-white p-6 shadow-doux">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-brun">Confidentialité</p>
      <h1 className="mt-2 text-3xl font-black text-encre">Politique de confidentialité</h1>

      <div className="mt-6 space-y-5 text-sm leading-7 text-encre">
        <p>
          Cette plateforme reçoit, enregistre et affiche des fiches pédagogiques validées par l’utilisateur depuis un
          GPT personnalisé. Elle ne génère pas de contenu par intelligence artificielle et ne demande aucune clé API
          OpenAI.
        </p>

        <section>
          <h2 className="text-lg font-black text-encre">Données traitées</h2>
          <p>
            Les données traitées peuvent inclure le nom, le courriel, les informations de connexion et le contenu des
            fiches pédagogiques envoyées volontairement vers la plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-encre">Utilisation</h2>
          <p>
            Les données servent uniquement à afficher, modifier, sauvegarder, historiser, exporter et imprimer les
            fiches pédagogiques de l’utilisateur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-encre">Sécurité</h2>
          <p>
            L’import des fiches est protégé par une clé secrète serveur. Les comptes utilisateurs sont protégés par mot
            de passe et les fiches ne sont accessibles qu’après connexion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-encre">Contact</h2>
          <p>Pour toute demande liée aux données, contactez Ehuzu Learning Lab.</p>
        </section>
      </div>
    </div>
  );
}
