import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        papier: "#fffaf1",
        ivoire: "#f8f2e7",
        encre: "#24231f",
        argile: "#b5674f",
        sauge: "#62735f",
        ciel: "#d8e6ea",
        miel: "#c89f54",
        brun: "#7a5a3a"
      },
      boxShadow: {
        doux: "0 18px 50px rgba(56, 43, 29, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
