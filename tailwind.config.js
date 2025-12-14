/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light theme colors - synced with constants/theme.ts
        background: "#FFFFFF",
        foreground: "#1C1C2E",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1C1C2E",
        },
        primary: {
          DEFAULT: "#C46A3A", // warm orange/terracotta
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#3D8B8B", // teal
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F5F5F7",
          foreground: "#6B6B7B",
        },
        accent: {
          DEFAULT: "#EBEBEB",
          foreground: "#1C1C2E",
        },
        destructive: {
          DEFAULT: "#DC4A4A",
          foreground: "#FAFAFA",
        },
        border: "#E5E5EA",
        input: "#E5E5EA",
        ring: "#C46A3A",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },
    },
  },
  plugins: [],
};
