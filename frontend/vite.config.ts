import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiTarget = (env.VITE_API_BASE_URL || "http://localhost:5253").replace(/\/$/, "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/openapi": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
