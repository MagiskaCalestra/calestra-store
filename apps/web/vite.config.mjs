import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: { port: 5288, strictPort: true },
  preview: { port: 5288, strictPort: true },
  resolve: {
    alias: {
      "@i18n": path.resolve(__dirname, "src/i18n"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
    },
  },
  css: { postcss: { plugins: [tailwindcss(), autoprefixer()] } },
});
