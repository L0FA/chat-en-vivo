import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import path from "path";
import ogs from "open-graph-scraper";

import { createClient } from "@libsql/client/web"; // ✅ LibSQL
import { Server } from "socket.io";
import { createServer } from "node:http";

dotenv.config();
const port = process.env.PORT ?? 3000;

const app = express();
const server = createServer(app);
const PAGE_SIZE = 100;

// Función para generar IDs únicos
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const broadcastMessage = (socket, payload) => {
    socket.emit("Mensaje en Chat", payload);
    socket.broadcast.emit("Mensaje en Chat", payload);
};

const io = new Server(server, {
    cors: {
        origin: "*", // Frontend Render
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"],
    maxHttpBufferSize: 50 * 1024 * 1024 // Permitir 50MB de carga
});

const db = createClient({
    url: process.env.DB_URL,
    authToken: process.env.DB_TOKEN,
});

async function init() {

    await db.execute(`
        CREATE TABLE IF NOT EXISTS Mensajes (
            id TEXT PRIMARY KEY,
            content TEXT,
            user TEXT,
            timestamp INTEGER,
            type TEXT,
            replyToId TEXT,
            replyToUser TEXT
        )
    `);

    // Migración de esquema para tablas existentes
    try {
        const tableInfo = await db.execute({ sql: "PRAGMA table_info(Mensajes)", args: [] });
        const existingColumns = tableInfo.rows.map(row => row.name);
        const idColumn = tableInfo.rows.find(row => row.name === "id");
        const idType = idColumn?.type?.toUpperCase() || "";

        const needReplyTo = !existingColumns.includes("replyToId") || !existingColumns.includes("replyToUser");
        const needIdMigration = idType !== "TEXT";

        if (needReplyTo || needIdMigration) {
            console.log("🛠️ Migrando tabla Mensajes al nuevo esquema...");
            await db.execute({ sql: "BEGIN TRANSACTION", args: [] });

            await db.execute(`
                CREATE TABLE IF NOT EXISTS Mensajes_new (
                    id TEXT PRIMARY KEY,
                    content TEXT,
                    user TEXT,
                    timestamp INTEGER,
                    type TEXT,
                    replyToId TEXT,
                    replyToUser TEXT
                )
            `);

            const selectColumns = [
                existingColumns.includes("id") ? "CAST(id AS TEXT) AS id" : "NULL AS id",
                existingColumns.includes("content") ? "content" : "NULL AS content",
                existingColumns.includes("user") ? "user" : "NULL AS user",
                existingColumns.includes("timestamp") ? "timestamp" : "NULL AS timestamp",
                existingColumns.includes("type") ? "type" : "NULL AS type",
                existingColumns.includes("replyToId") ? "replyToId" : "NULL AS replyToId",
                existingColumns.includes("replyToUser") ? "replyToUser" : "NULL AS replyToUser"
            ].join(", ");

            await db.execute({
                sql: `INSERT INTO Mensajes_new (id, content, user, timestamp, type, replyToId, replyToUser) SELECT ${selectColumns} FROM Mensajes`,
                args: []
            });

            await db.execute({ sql: "DROP TABLE IF EXISTS Mensajes", args: [] });
            await db.execute({ sql: "ALTER TABLE Mensajes_new RENAME TO Mensajes", args: [] });
            await db.execute({ sql: "COMMIT", args: [] });
            console.log("✅ Migración de tabla Mensajes completada");
        }
    } catch (error) {
        await db.execute({ sql: "ROLLBACK", args: [] }).catch(() => {});
        console.warn("⚠️ No se pudo migrar la tabla Mensajes:", error.message || error);
    }

    io.on("connection", async (socket) => {

        console.log("🟢 Usuario conectado:", socket.id);

        const user = socket.handshake.auth?.NombreUsuario || "Anonimo";
        // Registrar usuario
connectedUsers.set(socket.id, user);
io.emit("Usuarios Conectados", { users: [...connectedUsers.values()] });
const admins = (process.env.ADMINS || "").split(",").map(a => a.trim()).filter(Boolean);
socket.emit("Configuración", { admins });

        socket.on("disconnect", () => {
            connectedUsers.delete(socket.id);
io.emit("Usuarios Conectados", { users: [...connectedUsers.values()] });
            console.log("🔴 Usuario desconectado");
        });

        // ---------------- EDITAR MENSAJE ----------------
socket.on("Editar Mensaje", async (payload, callback) => {
    const { messageId, newContent } = payload;
    if (!messageId || !newContent) return;

    try {
        // Verificar que el mensaje sea del usuario
        const existing = await db.execute({
            sql: "SELECT user FROM Mensajes WHERE id = ?",
            args: [messageId]
        });

        if (!existing.rows.length || existing.rows[0].user !== user) {
            if (typeof callback === "function") callback({ status: "error", error: "No autorizado" });
            return;
        }

        await db.execute({
            sql: "UPDATE Mensajes SET content = ?, edited = 1 WHERE id = ?",
            args: [newContent, messageId]
        });

        io.emit("Mensaje Editado", { messageId, newContent });
        if (typeof callback === "function") callback({ status: "ok" });
    } catch (e) {
        console.error("❌ ERROR EDITAR:", e);
    }
});

// ---------------- ELIMINAR MENSAJE ----------------
socket.on("Eliminar Mensaje", async (payload, callback) => {
    const { messageId } = payload;
    if (!messageId) return;

    try {
        const existing = await db.execute({
            sql: "SELECT user FROM Mensajes WHERE id = ?",
            args: [messageId]
        });

        if (!existing.rows.length || existing.rows[0].user !== user) {
            if (typeof callback === "function") callback({ status: "error", error: "No autorizado" });
            return;
        }

        await db.execute({
            sql: "UPDATE Mensajes SET content = '[eliminado]', type = 'deleted' WHERE id = ?",
            args: [messageId]
        });

        io.emit("Mensaje Eliminado", { messageId });
        if (typeof callback === "function") callback({ status: "ok" });
    } catch (e) {
        console.error("❌ ERROR ELIMINAR:", e);
    }
});

        // ---------------- STICKER ----------------
        socket.on("Sticker en Chat", async (payload, callback) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const tipo = payload?.tipo || "emoji";
            const timestamp = payload?.timestamp || Date.now();
            const replyToId = payload?.replyToId || null;
            const replyToUser = payload?.replyToUser || null;

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, `sticker-${tipo}`, replyToId, replyToUser]
                });

                const messageData = {
                    id,
                    type: `sticker-${tipo}`,
                    content,
                    timestamp,
                    user,
                    replyToId,
                    replyToUser
                };
                broadcastMessage(socket, messageData);
                if (typeof callback === "function") callback({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR STICKER:", e);
                if (typeof callback === "function") callback({ status: "error", error: e.message || e });
            }
        });

        // ---------------- GIF ----------------
socket.on("GIF en Chat", async (payload, callback) => {
    const id = payload?.id || generateId();
    const content = payload?.url || "";
    const timestamp = payload?.timestamp || Date.now();

    try {
        await db.execute({
            sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [id, content, user, timestamp, "gif", null, null]
        });

        const messageData = { id, type: "gif", content, timestamp, user };
        broadcastMessage(socket, messageData);
        if (typeof callback === "function") callback({ status: "ok" });
    } catch (e) {
        console.error("❌ ERROR GIF:", e);
    }
});

// ---------------- REACCIONES ----------------
socket.on("Reacción", async (payload, callback) => {
    const { messageId, emoji } = payload;
    if (!messageId || !emoji) return;

    try {
        // Verificar si ya existe esa reacción de ese usuario
        const existing = await db.execute({
            sql: "SELECT id FROM Reacciones WHERE messageId = ? AND emoji = ? AND user = ?",
            args: [messageId, emoji, user]
        });

        let action = "";

        if (existing.rows.length > 0) {
            // Ya reaccionó → toggle off, borrar
            await db.execute({
                sql: "DELETE FROM Reacciones WHERE messageId = ? AND emoji = ? AND user = ?",
                args: [messageId, emoji, user]
            });
            action = "remove";
        } else {
            // No reaccionó → agregar
            const id = generateId();
            await db.execute({
                sql: "INSERT INTO Reacciones (id, messageId, emoji, user, timestamp) VALUES (?, ?, ?, ?, ?)",
                args: [id, messageId, emoji, user, Date.now()]
            });
            action = "add";
        }

        io.emit("Reacción Actualizada", {
            messageId,
            emoji,
            user,
            action
        });

        if (typeof callback === "function") callback({ status: "ok" });
    } catch (e) {
        console.error("❌ ERROR REACCIÓN:", e);
        if (typeof callback === "function") callback({ status: "error" });
    }
});

        // ---------------- TEXTO ----------------
        socket.on("Mensaje en Chat", async (payload, callback) => {
            const id = payload?.id || generateId();
            const content = typeof payload === "string" ? payload : payload?.msg || "";
            const timestamp = payload?.timestamp || Date.now();
            const replyToId = payload?.replyToId || null;
            const replyToUser = payload?.replyToUser || null;
            const destructSeconds = payload?.destructSeconds || 0;

            try {
                await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, edited, destructSeconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                args: [id, content, user, timestamp, "text", replyToId, replyToUser, 0, destructSeconds]
            });

                console.log("✅ Mensaje insertado en BD:", id);

                const messageData = {
                id, type: "text", content, timestamp, user,
    replyToId, replyToUser, destructSeconds
            };
                broadcastMessage(socket, messageData);
                if (typeof callback === "function") callback({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR DB (Mensaje):", e.message);
                if (typeof callback === "function") callback({ status: "error", error: e.message || e });
            }
        });

        // ---------------- SELF DESTRUCT ----------------
socket.on("Mensaje Visto", ({ messageId, seconds }) => {
    if (!messageId || !seconds) return;

    // Notificar a todos que el countdown arrancó
    io.emit("Countdown Iniciado", { messageId, seconds });

    // Programar eliminación en el servidor
    setTimeout(async () => {
        try {
            await db.execute({
                sql: "DELETE FROM Mensajes WHERE id = ?",
                args: [messageId]
            });
            io.emit("Mensaje Autodestruido", { messageId });
        } catch (e) {
            console.error("❌ ERROR SELF DESTRUCT:", e);
        }
    }, seconds * 1000);
});

        // ---------------- IMAGEN ----------------
        socket.on("Imagen en Chat", async (payload, callback) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const timestamp = payload?.timestamp || Date.now();
            const replyToId = payload?.replyToId || null;
            const replyToUser = payload?.replyToUser || null;

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "image", replyToId, replyToUser]
                });

                const messageData = {
                    id,
                    type: "image",
                    content,
                    timestamp,
                    user,
                    replyToId,
                    replyToUser
                };
                broadcastMessage(socket, messageData);
                if (typeof callback === "function") callback({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR DB:", e);
                if (typeof callback === "function") callback({ status: "error", error: e.message || e });
            }
        });

        // ---------------- VIDEO ----------------
        socket.on("Video en Chat", async (payload, callback) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const timestamp = payload?.timestamp || Date.now();
            const replyToId = payload?.replyToId || null;
            const replyToUser = payload?.replyToUser || null;

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "video", replyToId, replyToUser]
                });

                const messageData = {
                    id,
                    type: "video",
                    content,
                    timestamp,
                    user,
                    replyToId,
                    replyToUser
                };
                broadcastMessage(socket, messageData);
                if (typeof callback === "function") callback({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR DB:", e);
                if (typeof callback === "function") callback({ status: "error", error: e.message || e });
            }
        });

        // ---------------- AUDIO ----------------
        socket.on("Audio en Chat", async (payload, callback) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const timestamp = payload?.timestamp || Date.now();
            const replyToId = payload?.replyToId || null;
            const replyToUser = payload?.replyToUser || null;

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "audio", replyToId, replyToUser]
                });

                const messageData = {
                    id,
                    type: "audio",
                    content,
                    timestamp,
                    user,
                    replyToId,
                    replyToUser
                };
                broadcastMessage(socket, messageData);

                // Detectar links y generar preview
                const urlMatch = content.match(/https?:\/\/[^\s]+/);
                if (urlMatch) {
                fetchLinkPreview(urlMatch[0]).then(preview => {
                if (preview) {
                io.emit("Link Preview", { messageId: id, preview });
                }
            });
        }

                if (typeof callback === "function") callback({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR DB:", e);
                if (typeof callback === "function") callback({ status: "error", error: e.message || e });
            }
        });

        // ---------------- TYPING ----------------
socket.on("Escribiendo", (payload) => {
    const { typing } = payload;
    socket.broadcast.emit("Usuario Escribiendo", { user, typing });
});

// ---------------- READ STATUS ----------------
socket.on("Mensaje Leído", (payload) => {
    const { messageId } = payload;
    if (!messageId) return;

    socket.broadcast.emit("Estado Leído", {
        messageId,
        user
    });
});

        // ---------------- MÚSICA COMPARTIDA ----------------
        socket.on("Música Compartida", async (payload) => {
            const { url, title, platform, action } = payload;
            // action: "play", "pause", "seek" (para sincronización)
            // platform: "spotify", "youtube", "soundcloud"
            
            io.emit("Música Actualizada", {
                url,
                title,
                platform,
                action,
                user,
                timestamp: Date.now()
            });
        });

        // Sincronización de música (posición, pausa, etc.)
socket.on("Sincronizar Música", (payload) => {
    const { currentTime, isPlaying } = payload;
    // Solo a los OTROS usuarios, no al que emitió
    socket.broadcast.emit("Música Sincronizada", {
        currentTime,
        isPlaying,
        user,
        timestamp: Date.now()
    });
});

// ---------------- MÚSICA APP ----------------
socket.on("Subir Canción", async (payload, callback) => {
    const { titulo, artista, tipo, contenido, portada } = payload;
    if (!titulo || !tipo || !contenido) return;

    const id = generateId();
    const timestamp = Date.now();

    try {
        await db.execute({
            sql: "INSERT INTO Canciones (id, titulo, artista, tipo, contenido, usuario, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [id, titulo, artista || "Desconocido", tipo, contenido, user, timestamp]
        });

        const cancion = { id, titulo, artista: artista || "Desconocido", tipo, contenido, portada: portada || null, usuario: user, timestamp };
        io.emit("Canción Agregada", cancion);
        if (typeof callback === "function") callback({ status: "ok", id });
    } catch (e) {
        console.error("❌ ERROR CANCIÓN:", e);
        if (typeof callback === "function") callback({ status: "error" });
    }
});

socket.on("Sync Música App", (payload) => {
    const { accion, cancionId, currentTime, timestamp } = payload;
    socket.broadcast.emit("Sync Música App", { accion, cancionId, currentTime, usuario: user, timestamp });
});

socket.on("Eliminar Canción", async (payload, callback) => {
    const { cancionId } = payload;
    if (!cancionId) return;
    try {
        await db.execute({ sql: "DELETE FROM Canciones WHERE id = ?", args: [cancionId] });
        io.emit("Canción Eliminada", { cancionId });
        if (typeof callback === "function") callback({ status: "ok" });
    } catch (e) {
        console.error("❌ ERROR ELIMINAR CANCIÓN:", e);
    }
});

        // ---------------- RECUPERACIÓN (PAGINADA) ----------------
        try {
            const results = await db.execute(`SELECT * FROM Mensajes ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`);

            const initialRows = [...results.rows].reverse();
            initialRows.forEach((row) => {
                let content = row.content;
                try {
                    const parsed = JSON.parse(row.content);
                    if (parsed?.msg) content = parsed.msg;
                } catch {}

                socket.emit("Mensaje en Chat", {
                    id: row.id,
                    type: row.type || "text",
                    content,
                    timestamp: row.timestamp,
                    user: row.user || "Anonimo",
                    replyToId: row.replyToId || null,
                    replyToUser: row.replyToUser || null,
                    edited: row.edited || 0,
                    destructSeconds: row.destructSeconds || 0
                });
            });

            let hasMore = false;
            if (initialRows.length > 0) {
                const oldestTimestamp = initialRows[0]?.timestamp;
                const older = await db.execute({
                    sql: "SELECT 1 FROM Mensajes WHERE timestamp < ? LIMIT 1",
                    args: [oldestTimestamp]
                });
                hasMore = older.rows.length > 0;
            }
            socket.emit("historial cargado", { hasMore, pageSize: PAGE_SIZE });
        } catch (e) {
            console.error("❌ ERROR RECOVERY:", e);
        }

        // Recuperar reacciones
const reacciones = await db.execute("SELECT * FROM Reacciones");
reacciones.rows.forEach(row => {
    socket.emit("Reacción Actualizada", {
        messageId: row.messageId,
        emoji: row.emoji,
        user: row.user,
        action: "add"
    });
});

        socket.on("Cargar mensajes anteriores", async ({ beforeTimestamp } = {}, callback) => {
            if (!beforeTimestamp) {
                if (typeof callback === "function") callback({ status: "error", error: "beforeTimestamp requerido" });
                return;
            }

            try {
                const results = await db.execute({
                    sql: `SELECT * FROM Mensajes WHERE timestamp < ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                    args: [beforeTimestamp]
                });

                const rows = [...results.rows].reverse().map((row) => {
                    let content = row.content;
                    try {
                        const parsed = JSON.parse(row.content);
                        if (parsed?.msg) content = parsed.msg;
                    } catch {}

                    return {
                        id: row.id,
                        type: row.type || "text",
                        content,
                        timestamp: row.timestamp,
                        user: row.user || "Anonimo",
                        replyToId: row.replyToId || null,
                        replyToUser: row.replyToUser || null
                    };
                });

                let hasMore = false;
                if (rows.length > 0) {
                    const oldestTimestamp = rows[0]?.timestamp;
                    const older = await db.execute({
                        sql: "SELECT 1 FROM Mensajes WHERE timestamp < ? LIMIT 1",
                        args: [oldestTimestamp]
                    });
                    hasMore = older.rows.length > 0;
                }

                if (typeof callback === "function") {
                    callback({
                        status: "ok",
                        messages: rows,
                        hasMore
                    });
                }
            } catch (error) {
                console.error("❌ ERROR PAGINACION:", error);
                if (typeof callback === "function") callback({ status: "error", error: error.message || error });
            }
        });
    });

    app.use(logger("dev"));

    // Recuperar canciones
const canciones = await db.execute("SELECT * FROM Canciones ORDER BY timestamp ASC");
canciones.rows.forEach(row => {
    socket.emit("Canción Agregada", {
        id: row.id,
        titulo: row.titulo,
        artista: row.artista,
        tipo: row.tipo,
        contenido: row.contenido,
        usuario: row.usuario,
        timestamp: row.timestamp
    });
});

    // Deshabilitar caché para archivos estáticos
    app.use((req, res, next) => {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        next();
    });

    app.use(express.static(path.join(process.cwd(), "dist")));

    // Fallback para React Router 
    // (Asegurarse de poner esto después de las APIs si agregas más)
    /* 
    app.get("*", (req, res) => {
        res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
    */

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(`❌ Error: el puerto ${port} ya está en uso.`);
            console.error("   Cierra el proceso que usa ese puerto o cambia la variable PORT.");
            console.error("   Ejemplo: PORT=3001 npm run dev");
            process.exit(1);
        }
        console.error("❌ Error inesperado en el servidor:", error);
        process.exit(1);
    });

app.get("/api/giphy/trending", async (req, res) => {
    try {
        const r = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${process.env.GIPHY_API_KEY}&limit=20&rating=g`);
        const data = await r.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Error Giphy" });
    }
});

app.get("/api/giphy/search", async (req, res) => {
    const q = req.query.q || "";
    try {
        const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=20&rating=g`);
        const data = await r.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Error Giphy" });
    }
});

    // Fallback para React Router
    app.get("*", (req, res) => {
        res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });

    server.listen(port, () => {
        console.log(`🚀 Servidor corriendo en puerto ${port}`);
    });
}

async function fetchLinkPreview(url) {
    try {
        const { result } = await ogs({ url, timeout: 5000 });
        if (!result.success) return null;
        return {
            url,
            title: result.ogTitle || result.twitterTitle || "",
            description: result.ogDescription || result.twitterDescription || "",
            image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || "",
            siteName: result.ogSiteName || ""
        };
    } catch {
        return null;
    }
}

const connectedUsers = new Map(); // socketId → username

init();
