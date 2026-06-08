import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/connexion",
        destination: "/",
        permanent: false
      },
      {
        source: "/inscription",
        destination: "/",
        permanent: false
      },
      {
        source: "/mot-de-passe-oublie",
        destination: "/",
        permanent: false
      },
      {
        source: "/tableau-de-bord",
        destination: "/",
        permanent: false
      },
      {
        source: "/historique",
        destination: "/",
        permanent: false
      },
      {
        source: "/parametres",
        destination: "/",
        permanent: false
      },
      {
        source: "/fiches/:path*",
        destination: "/",
        permanent: false
      },
      {
        source: "/admin/:path*",
        destination: "/",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
