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
        papier: "#F5F7FA",
        ivoire: "#FFFFFF",
        encre: "#172033",
        argile: "#5D6B78",
        sauge: "#1B6CA8",
        ciel: "#EAF3FA",
        miel: "#E8732A",
        brun: "#5D6B78",
        sante: "#2E8B57",
        danger: "#C0392B"
      },
      boxShadow: {
        doux: "0 18px 45px rgba(23, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
