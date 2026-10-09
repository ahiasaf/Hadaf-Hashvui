import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://hadaf-hashvui.vercel.app",
  output: "static",
  integrations: [react()],
  publicDir: "static",
  build: { format: "file" },
  devToolbar: { enabled: false },
});
