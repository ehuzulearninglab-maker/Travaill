import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function ConnexionPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="w-full">
        <AuthForm mode="connexion" />
        <div className="mt-5 space-y-2 text-center text-sm text-brun">
          <p>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-bold text-sauge hover:underline">
              Créer un compte
            </Link>
          </p>
          <p>
            <Link href="/mot-de-passe-oublie" className="font-bold text-sauge hover:underline">
              Mot de passe oublié
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
