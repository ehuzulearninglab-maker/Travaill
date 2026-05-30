import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function InscriptionPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="w-full">
        <AuthForm mode="inscription" />
        <p className="mt-5 text-center text-sm text-brun">
          Vous avez déjà un compte ?{" "}
          <Link href="/connexion" className="font-bold text-sauge hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
