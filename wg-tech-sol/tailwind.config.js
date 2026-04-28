/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "spin-slow": "spin 6s linear infinite",
      },
      fontFamily: {
        barlow: ["var(--font-barlow)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

// module.exports = {
//   theme: {
//     extend: {
//       keyframes: {
//         float: {
//           "0%, 100%": { transform: "translateY(0px)" },
//           "50%": { transform: "translateY(-10px)" },
//         },
//       },
//       animation: {
//         //new animation for logo and hero section items
//         "spin-slow": "spin 6s linear infinite",
//       },
//       fontFamily: {
//         barlow: ["var(--font-barlow)", "sans-serif"],
//       },
//     },
//   },
//   plugins: [],
// };
