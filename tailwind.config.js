/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        surface: "#13131A",
        surfaceHigh: "#1E1E2A",
        accent: "#7C3AED",
        accentLight: "#A78BFA",
        textPrimary: "#F8F8FF",
        textSecondary: "#9494A8",
        border: "#2A2A3A"
      },
      borderRadius: {
        card: "16px",
        button: "12px"
      }
    }
  },
  plugins: [],
};
