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
            "/api": "http://localhost:3000",
            "/socket.io": {
                target: "http://localhost:3000",
                ws: true
            }
        }
    },
    build: {
        sourcemap: true
    }
});