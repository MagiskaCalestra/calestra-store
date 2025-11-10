/**
 * 💫 Calestra React ESLint Base (Flat config, ESLint v9)
 * Delas av apps/store-classic och apps/store-3d
 */

import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginHooks from "eslint-plugin-react-hooks";
import pluginA11y from "eslint-plugin-jsx-a11y";

export default [
  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],
    ignores: ["node_modules/**", "dist/**", "build/**", ".vite/**", "coverage/**"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      // OBS: import.meta är inte en global – definiera den inte här
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
      },
    },

    plugins: {
      react: pluginReact,
      "react-hooks": pluginHooks,
      "jsx-a11y": pluginA11y,
    },

    settings: {
      react: { version: "detect" },
    },

    rules: {
      /* React */
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",

      /* Hooks */
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      /* A11y */
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/no-autofocus": "warn",

      /* Stil/ren kod */
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "prefer-const": "warn",
      eqeqeq: ["error", "always"],
      semi: ["error", "always"],
      quotes: ["warn", "double", { avoidEscape: true }],
      "object-curly-spacing": ["warn", "always"],
      "brace-style": ["warn", "1tbs", { allowSingleLine: true }],
      "no-multiple-empty-lines": ["warn", { max: 2 }],
      curly: ["warn", "multi-line"],
    },
  },
];
