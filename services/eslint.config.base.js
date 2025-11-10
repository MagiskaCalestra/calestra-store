/**
 * 🌐 Calestra Core ESLint Base Config
 * Gäller för alla microservices (finance, orders, progress, infinity, nexus, mock-api)
 * Version: 1.0
 */

import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "dist/**", "build/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly"
      }
    },
    rules: {
      // Allmän kodstil
      "semi": ["error", "always"],
      "quotes": ["warn", "double", { "avoidEscape": true }],
      "no-multiple-empty-lines": ["warn", { "max": 2 }],
      "indent": ["warn", 2, { "SwitchCase": 1 }],
      "comma-dangle": ["warn", "only-multiline"],

      // Säkerhetsregler
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // Ren kod / användning
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-undef": "error",
      "no-var": "error",
      "prefer-const": "warn",
      "eqeqeq": ["error", "always"],

      // Layout och läsbarhet
      "curly": ["warn", "multi-line"],
      "brace-style": ["warn", "1tbs", { "allowSingleLine": true }],
      "object-curly-spacing": ["warn", "always"],

      // För framtida kompatibilitet
      "no-console": "off"
    }
  }
];
