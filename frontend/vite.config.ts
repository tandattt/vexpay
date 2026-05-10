import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend hiện gọi thẳng BE qua BASE_URL_BACKEND (src/config/api.ts).
// Nếu cần tránh CORS/cookie issues, có thể bật lại proxy /api tại đây.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
