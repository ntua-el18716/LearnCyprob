module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "astro"],
  root: true,
  overrides: [
    {
      // files: ["*.astro"],
      files: ["*.ts", "*.tsx"],
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
      extends: ["plugin:@typescript-eslint/strict"],
    },
    {
      files: ["*.ts", "*.tsx"],
      extends: [
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:@typescript-eslint/strict",
      ],
    },
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:astro/recommended",
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    "no-unused-vars": "warn", // Change this rule to warn instead of error
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { vars: "all", args: "after-used", ignoreRestSiblings: false },
    ],
  },
};
