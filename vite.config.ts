import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : le site marche aussi bien sur GitHub Pages (sous /JeuDeCarte/) qu'en local.
  base: "./",
});
