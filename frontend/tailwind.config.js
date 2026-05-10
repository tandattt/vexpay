/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F8FAFC",
        card: "#FFFFFF",
        primary: "#4F46E5",
        secondary: "#7C3AED",
        ink: "#0F172A",
        muted: "#64748B",
        hairline: "#E2E8F0",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 24px -12px rgba(79, 70, 229, 0.18)",
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -16px rgba(79, 70, 229, 0.12)",
      },
    },
  },
  plugins: [],
};
