import dotenv from "dotenv";
dotenv.config();

import express from "express";
import process from "node:process";
import logger from "morgan";
import path from "path";
import { Server } from "socket.io";
import { createServer } from "node:http";

import { initDatabase, db } from "./modules/database.js";
import { setupAuth } from "./modules/auth.js";
import { setupRooms } from "./modules/rooms.js";
import { setupMessages } from "./modules/messages.js";
import { setupMusic } from "./modules/music.js";
import { setupPagination } from "./modules/pagination.js";
import { setupCalls } from "./modules/calls.js";

const app = express();
const server = createServer(app);
const port = process.env.PORT ?? 3000;

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
    maxHttpBufferSize: 1e9
});

const connectedUsers = new Map();

io.on("connection", async (socket) => {
    console.log("🔌 Cliente conectado:", socket.id);

    await setupAuth(io, socket, connectedUsers);

    const user = connectedUsers.get(socket.id);
    const isAdmin = user?.nombre && ["Testing", "La Compu Del Admin", "El Celu Del Admin", "Anonimo", "Wachin", "usuariorosa"].includes(user?.nombre);
    const userRoom = user?.sala || null;

    // Cargar todos los módulos en paralelo para velocidad
    setupRooms(socket, connectedUsers);
    setupMessages(io, socket, connectedUsers, isAdmin, userRoom);
    await setupMusic(io, socket, connectedUsers);
    await setupPagination(io, socket, connectedUsers, isAdmin, userRoom);
    setupCalls(io, socket, connectedUsers);

    socket.on("Escribiendo", ({ typing }) => {
        if (user) {
            socket.broadcast.to(userRoom).emit("Usuario Escribiendo", { user: user.nombre, typing, room: userRoom });
        }
    });

    socket.on("Mensaje Leído", ({ messageId }) => {
        socket.broadcast.to(userRoom).emit("Estado Leído", { messageId });
    });

    socket.on("Mensaje Visto", ({ messageId, seconds }) => {
        if (!messageId || !seconds) return;
        io.emit("Countdown Iniciado", { messageId, seconds });
        setTimeout(async () => {
            try {
                await db.execute({ sql: "DELETE FROM Mensajes WHERE id = ?", args: [messageId] });
                io.emit("Mensaje Autodestruido", { messageId });
            } catch (e) {
                console.error("❌ ERROR SELF DESTRUCT:", e);
            }
        }, seconds * 1000);
    });

    socket.on("Mensaje Global", async (payload, cb) => {
        if (!isAdmin) { cb?.({ status: "error", message: "Solo admins" }); return; }
        cb?.({ status: "ok" });
    });

    socket.on("Hacer Admin", async (_payload, cb) => {
        if (!isAdmin) { cb?.({ status: "error" }); return; }
        cb?.({ status: "ok" });
    });

    socket.on("Banear Usuario", async (_payload, cb) => {
        if (!isAdmin) { cb?.({ status: "error" }); return; }
        cb?.({ status: "ok" });
    });
});

app.get("/", (_, res) => res.send("☁️ WhatsAppn't Server"));
app.get("/health", (_, res) => res.json({ status: "ok", users: connectedUsers.size }));

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const TENOR_API_KEY = process.env.TENOR_API_KEY || "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ";
const GIPHY_BASE = "https://api.giphy.com/v1/gifs";
const TENOR_BASE = "https://tenor.googleapis.com/v2";

async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

app.get("/api/giphy/trending", async (_, res) => {
    try {
        if (GIPHY_API_KEY) {
            const response = await fetchWithTimeout(`${GIPHY_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=20`);
            const data = await response.json();
            return res.json(data);
        }
        // Fallback a Tenor
        const response = await fetchWithTimeout(`${TENOR_BASE}/featured?key=${TENOR_API_KEY}&limit=20`);
        const data = await response.json();
        const formatted = { data: (data.results || []).map(g => ({
            id: g.id,
            images: {
                fixed_height: { url: g.media_formats.gif.url },
                fixed_height_small: { url: g.media_formats.tinygif.url }
            }
        }))};
        res.json(formatted);
    } catch (e) {
        res.status(500).json({ error: e.message, data: [] });
    }
});

app.get("/api/giphy/search", async (req, res) => {
    try {
        const q = req.query.q || "";
        if (GIPHY_API_KEY) {
            const response = await fetchWithTimeout(`${GIPHY_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=20`);
            const data = await response.json();
            return res.json(data);
        }
        // Fallback a Tenor
        const response = await fetchWithTimeout(`${TENOR_BASE}/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(q)}&limit=20`);
        const data = await response.json();
        const formatted = { data: (data.results || []).map(g => ({
            id: g.id,
            images: {
                fixed_height: { url: g.media_formats.gif.url },
                fixed_height_small: { url: g.media_formats.tinygif.url }
            }
        }))};
        res.json(formatted);
    } catch (e) {
        res.status(500).json({ error: e.message, data: [] });
    }
});

app.use(logger("dev"));
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
});
app.use(express.static(path.join(process.cwd(), "dist")));
app.get(/.*/, (_, res) => {
    res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});

initDatabase().then(() => {
    server.listen(port, () => console.log(`🚀 Server corriendo en puerto ${port}`));
});
