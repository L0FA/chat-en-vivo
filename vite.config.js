import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: "0.0.0.0",
        port: 8080,
        strictPort: false,
        watch: {
            usePolling: true
        },
        proxy: {
            "/api": "https://chat-en-vivo-ymsf.onrender.com",
            "/socket.io": {
                target: "https://chat-en-vivo-ymsf.onrender.com",
                ws: true,
                changeOrigin: true
            }
        }
    },
    build: {
        sourcemap: true
    }
});