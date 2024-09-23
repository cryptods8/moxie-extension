/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: [
    "./contents/**/*.tsx",
    "./ui/**/*.tsx",
    "*.tsx",
    "./node_modules/@radix-ui/react-hover-card/**/*.{js,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        default: {
          light: "#ffffff",
          dark: "#17101f"
        },
        moxie: {
          500: "#6A2DE0"
        }
      }
    }
  },
  plugins: []
}
