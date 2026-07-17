/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Vazirmatn",
          "IRANSans",
          "Tahoma",
          "Arial",
          "sans-serif"
        ]
      },
      boxShadow: {
        soft: "0 18px 60px -30px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};
