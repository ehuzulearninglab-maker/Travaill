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
        papier: "#FDFBF7",
        ivoire: "#F7F3EC",
        encre: "#1B4332",
        argile: "#52796F",
        sauge: "#10B981",
        ciel: "#E8F7F1",
        miel: "#F59E0B",
        brun: "#52796F"
      },
      boxShadow: {
        doux: "0 18px 45px rgba(27, 67, 50, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
