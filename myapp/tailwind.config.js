export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#7c3aed",
          DEFAULT: "#5b21b6",
          dark: "#4c1d95",
        },
      },
      boxShadow: {
        soft: "0 20px 50px rgba(99, 102, 241, 0.15)",
      },
    },
  },
  plugins: [],
}
