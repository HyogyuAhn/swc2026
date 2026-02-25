/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                outfit: ['var(--font-outfit)', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
