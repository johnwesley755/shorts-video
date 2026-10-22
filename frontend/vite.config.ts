import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/proxy": {
        target: "https://johnwesley756-shorts-video.hf.space/api",
        changeOrigin: true,
        rewrite: (reqPath) => {
          const url = new URL(reqPath, "http://localhost");
          const endpoint = url.searchParams.get("endpoint") || "";
          const cleanEndpoint = endpoint.replace(/^\/+/, "");
          return cleanEndpoint === "videos" ? "/videos/" : `/${cleanEndpoint}`;
        },
      },
    },
  },
});
