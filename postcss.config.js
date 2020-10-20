module.exports = {
  plugins: [
    "tailwindcss",
    // process.env.NODE_ENV === "production" ? purgecss : undefined,
    "postcss-preset-env",
    ['cssnano', {
      preset: 'default',
    }],
  ],
};
