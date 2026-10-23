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
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/api/proxy": {
        target: "http://localhost:5000/api",
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
