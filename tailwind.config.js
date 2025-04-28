/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/*.{js,ts,jsx,tsx}",
    "./src/app/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "stripe-blue": "#635bff",
        "stripe-gray": "#f6f9fc",
      },
    },
  },
  plugins: [],
};
