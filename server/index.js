import express from "express";
import process from "node:process";
import logger from "morgan";
import dotenv from "dotenv";
import path from "path";
import { createClient } from "@libsql/client/web";
import { Server } from "socket.io";
import { createServer } from "node:http";
import createCallState from "./modules/callState.js";

dotenv.config();

const app = express();
const server = createServer(app);
const port = process.env.PORT ?? 3000;
const PAGE_SIZE = 100;

const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const broadcastMessage = (io, socket, payload, room) => {
    socket.emit("Mensaje en Chat", payload);
    if (room) socket.to(room).emit("Mensaje en Chat", payload);
};

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
    maxHttpBufferSize: 1e9
});

const callState = createCallState(io);

const db = createClient({
    url: process.env.DB_URL,
    authToken: process.env.DB_TOKEN,
});

const connectedUsers = new Map();
const userSockets = new Map();

async function init() {

    await db.execute(`
        CREATE TABLE IF NOT EXISTS Usuarios (
            nombre TEXT PRIMARY KEY,
            avatar TEXT,
            creado INTEGER NOT NULL
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS Mensajes (
            id TEXT PRIMARY KEY,
            content TEXT,
            user TEXT,
            timestamp INTEGER,
            type TEXT,
            replyToId TEXT,
            replyToUser TEXT,
            replyToContent TEXT,
            edited INTEGER DEFAULT 0,
            destructSeconds INTEGER DEFAULT 0,
            room TEXT
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS Reacciones (
            id TEXT PRIMARY KEY,
            messageId TEXT,
            emoji TEXT,
            user TEXT,
            timestamp INTEGER
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS Visto (
            id TEXT PRIMARY KEY,
            messageId TEXT,
            user TEXT,
            timestamp INTEGER
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS Canciones (
            id TEXT PRIMARY KEY,
            titulo TEXT NOT NULL,
            artista TEXT,
            tipo TEXT NOT NULL,
            contenido TEXT NOT NULL,
            portada TEXT,
            usuario TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS Salas (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            dueno TEXT NOT NULL,
            creado INTEGER NOT NULL,
            esPrivada INTEGER DEFAULT 1
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS MiembrosSala (
            salaId TEXT,
            usuario TEXT,
            rol TEXT DEFAULT 'member',
            esAdmin INTEGER DEFAULT 0,
            joinedAt INTEGER,
            PRIMARY KEY (salaId, usuario)
        )
    `);

    try {
        await db.execute({ sql: "ALTER TABLE Mensajes ADD COLUMN edited INTEGER DEFAULT 0", args: [] });
    } catch {"_"}
    try {
        await db.execute({ sql: "ALTER TABLE Mensajes ADD COLUMN destructSeconds INTEGER DEFAULT 0", args: [] });
    } catch {"_"}
    try {
        await db.execute({ sql: "ALTER TABLE Canciones ADD COLUMN portada TEXT", args: [] });
    } catch {"_"}
    try {
        await db.execute({ sql: "ALTER TABLE Mensajes ADD COLUMN room TEXT", args: [] });
    } catch {"_"}
    try {
        await db.execute({ sql: "ALTER TABLE Mensajes ADD COLUMN replyToContent TEXT", args: [] });
    } catch {"_"}
    try {
        await db.execute({ sql: "ALTER TABLE MiembrosSala ADD COLUMN esAdmin INTEGER DEFAULT 0", args: [] });
    } catch {"_"}

    // Crear sala de admins si no existe
    const ADMINS = ["Testing", "La Compu Del Admin", "Anonimo", "Wachin", "usuariorosa"];
    const SALA_ADMINS_ID = "sala-admins-global";
    
    try {
        const existingSala = await db.execute({ sql: "SELECT id FROM Salas WHERE id = ?", args: [SALA_ADMINS_ID] });
        if (!existingSala.rows.length) {
            const timestamp = Date.now();
            await db.execute({
                sql: "INSERT INTO Salas (id, nombre, descripcion, dueno, creado, esPrivada) VALUES (?, ?, ?, ?, ?, ?)",
                args: [SALA_ADMINS_ID, "💎 Sala de Admins", "Sala exclusiva para admins", "La Compu Del Admin", timestamp, 1]
            });
            
            // Migrar TODOS los mensajes existentes a esta sala
            await db.execute({
                sql: "UPDATE Mensajes SET room = ? WHERE room IS NULL OR room = ''",
                args: [SALA_ADMINS_ID]
            });
            
            console.log("✅ Sala de Admins creada");
            console.log("✅ Mensajes migrados a la sala de admins");
        }
        
        // Siempre asegurar que los admins sean miembros
        const timestamp = Date.now();
        for (const admin of ADMINS) {
            await db.execute({
                sql: "INSERT OR REPLACE INTO MiembrosSala (salaId, usuario, rol, esAdmin, joinedAt) VALUES (?, ?, ?, ?, ?)",
                args: [SALA_ADMINS_ID, admin, "admin", 1, timestamp]
            });
        }
        console.log("✅ Miembros de sala de admins asegurados");
        
    } catch (e) {
        console.error("❌ ERROR-crear-sala-admins:", e);
    }
}

io.on("connection", (socket) => {
    const user = socket.handshake.auth?.NombreUsuario || "Invitado";
        
    console.log("🟢 Conectando:", user);

    (async () => {
        try {
            const existingUser = await db.execute({
                sql: "SELECT nombre FROM Usuarios WHERE nombre = ?",
                args: [user]
            });

            if (existingUser.rows.length === 0) {
                const allUsers = await db.execute({ sql: "SELECT nombre FROM Usuarios", args: [] });
                if (allUsers.rows.length > 0) {
                    socket.emit("Error", { message: "Ese nombre de usuario ya existe. Elegí otro." });
                    socket.disconnect();
                    return;
                }
                await db.execute({
                    sql: "INSERT INTO Usuarios (nombre, avatar, creado) VALUES (?, ?, ?)",
                    args: [user, null, Date.now()]
                });
            }
        } catch (e) {
            console.error("❌ ERROR VALIDAR USUARIO:", e);
            socket.emit("Error", { message: "Error al validar usuario" });
            socket.disconnect();
            return;
        }

        console.log("🟢 Conectado:", user);

        connectedUsers.set(socket.id, user);
        userSockets.set(user, socket.id);
        callState.registerUser(socket.id, user);
        io.emit("Usuarios Conectados", { users: [...connectedUsers.values()] });

        socket.on("Obtener Mis Salas", async (cb) => {
            try {
                const salas = await db.execute({
                    sql: `SELECT s.*, m.esAdmin FROM Salas s 
                          JOIN MiembrosSala m ON s.id = m.salaId 
                          WHERE m.usuario = ?`,
                    args: [user]
                });
                cb?.({ status: "ok", salas: salas.rows });
            } catch (e) {
                console.error("❌ ERROR OBTENER SALAS:", e);
                cb?.({ status: "error" });
            }
        });

        socket.on("Crear Sala", async ({ nombre, descripcion }, cb) => {
            const salaId = generateId();
            const timestamp = Date.now();
            
            try {
                await db.execute({
                    sql: "INSERT INTO Salas (id, nombre, descripcion, dueno, creado, esPrivada) VALUES (?, ?, ?, ?, ?, ?)",
                    args: [salaId, nombre, descripcion || "", user, timestamp, 1]
                });
                
                await db.execute({
                    sql: "INSERT INTO MiembrosSala (salaId, usuario, rol, joinedAt) VALUES (?, ?, ?, ?)",
                    args: [salaId, user, "owner", timestamp]
                });
                
                socket.join(salaId);
                io.emit("Sala Creada", { id: salaId, nombre, descripcion, dueno: user });
                cb?.({ status: "ok", sala: { id: salaId, nombre, descripcion, dueno: user } });
            } catch (e) {
                console.error("❌ ERROR CREAR SALA:", e);
                cb?.({ status: "error" });
            }
        });

        socket.on("Unirse Sala", async ({ salaId }, cb) => {
            try {
                const sala = await db.execute({ sql: "SELECT * FROM Salas WHERE id = ?", args: [salaId] });
                if (!sala.rows.length) {
                    cb?.({ status: "error", error: "Sala no existe" });
                    return;
                }
                
                await db.execute({
                    sql: "INSERT OR IGNORE INTO MiembrosSala (salaId, usuario, rol, joinedAt) VALUES (?, ?, ?, ?)",
                    args: [salaId, user, "member", Date.now()]
                });
                
                socket.join(salaId);
                
                const miembros = await db.execute({ 
                    sql: "SELECT usuario FROM MiembrosSala WHERE salaId = ?", 
                    args: [salaId] 
                });
                
                cb?.({ status: "ok", sala: sala.rows[0], miembros: miembros.rows.map(r => r.usuario) });
            } catch (e) {
                console.error("❌ ERROR UNIRSE SALA:", e);
                cb?.({ status: "error" });
            }
        });

        socket.on("Invitar a Sala", async ({ salaId, usuario }, cb) => {
            try {
                const sala = await db.execute({ sql: "SELECT dueno FROM Salas WHERE id = ?", args: [salaId] });
                if (!sala.rows.length || sala.rows[0].dueno !== user) {
                    cb?.({ status: "error", error: "No tienes permiso" });
                    return;
                }
                
                await db.execute({
                    sql: "INSERT OR IGNORE INTO MiembrosSala (salaId, usuario, rol, joinedAt) VALUES (?, ?, ?, ?)",
                    args: [salaId, usuario, "member", Date.now()]
                });
                
                const invitedSocketId = userSockets.get(usuario);
                if (invitedSocketId) {
                    io.to(invitedSocketId).emit("Invitacion Recibida", { 
                        salaId, 
                        nombre: sala.rows[0].nombre,
                        invitedBy: user 
                    });
                }
                
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR INVITAR:", e);
                cb?.({ status: "error" });
            }
        });

        socket.on("Salir de Sala", async ({ salaId }, cb) => {
            try {
                await db.execute({ sql: "DELETE FROM MiembrosSala WHERE salaId = ? AND usuario = ?", args: [salaId, user] });
                socket.leave(salaId);
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR SALIR SALA:", e);
                cb?.({ status: "error" });
            }
        });

        socket.on("Eliminar Sala", async ({ salaId }, cb) => {
            try {
                const sala = await db.execute({ sql: "SELECT dueno FROM Salas WHERE id = ?", args: [salaId] });
                if (!sala.rows.length || sala.rows[0].dueno !== user) {
                    cb?.({ status: "error", error: "No tienes permiso" });
                    return;
                }
                
                await db.execute({ sql: "DELETE FROM Mensajes WHERE room = ?", args: [salaId] });
                await db.execute({ sql: "DELETE FROM MiembrosSala WHERE salaId = ?", args: [salaId] });
                await db.execute({ sql: "DELETE FROM Salas WHERE id = ?", args: [salaId] });
                
                io.to(salaId).emit("Sala Eliminada", { salaId });
                
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR ELIMINAR SALA:", e);
                cb?.({ status: "error" });
            }
        });

        socket.on("disconnect", () => {
            console.log("🔴 Desconectado:", user);
            connectedUsers.delete(socket.id);
            userSockets.delete(user);
            callState.unregisterUser(socket.id);
            io.emit("Usuarios Conectados", { users: [...connectedUsers.values()] });
        });

        socket.on("Mensaje en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = typeof payload === "string" ? payload : payload?.msg || "";
            const timestamp = payload?.timestamp || Date.now();
            const replyToId = payload?.replyToId || null;
            const replyToUser = payload?.replyToUser || null;
            const replyToContent = payload?.replyToContent || null;
            const room = payload?.room;
            
            if (!room) {
                cb?.({ status: "error", error: "Sin sala" });
                return;
            }

            const miembros = await db.execute({ 
                sql: "SELECT usuario FROM MiembrosSala WHERE salaId = ?", 
                args: [room] 
            });
            const miembrosList = miembros.rows.map(r => r.usuario);
            if (!miembrosList.includes(user)) {
                cb?.({ status: "error", error: "No eres miembro" });
                return;
            }

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, replyToContent, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "text", replyToId, replyToUser, replyToContent, room]
                });

                broadcastMessage(io, socket, { id, type: "text", content, timestamp, user, replyToId, replyToUser, replyToContent, room }, room);
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR TEXTO:", e);
                cb?.({ status: "error" });
            }
        });

        socket.on("Imagen en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const timestamp = payload?.timestamp || Date.now();
            const room = payload?.room;

            if (!room) { cb?.({ status: "error" }); return; }

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "image", room]
                });

                broadcastMessage(io, socket, { id, type: "image", content, timestamp, user, room }, room);
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR IMAGEN:", e);
            }
        });

        socket.on("Video en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const timestamp = payload?.timestamp || Date.now();
            const room = payload?.room;

            if (!room) { cb?.({ status: "error" }); return; }

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "video", room]
                });

                broadcastMessage(io, socket, { id, type: "video", content, timestamp, user, room }, room);
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR VIDEO:", e);
            }
        });

        socket.on("Audio en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const timestamp = payload?.timestamp || Date.now();
            const room = payload?.room;

            if (!room) { cb?.({ status: "error" }); return; }

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "audio", room]
                });

                broadcastMessage(io, socket, { id, type: "audio", content, timestamp, user, room }, room);
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR AUDIO:", e);
            }
        });

        socket.on("Sticker en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const tipo = payload?.tipo || "emoji";
            const timestamp = payload?.timestamp || Date.now();
            const room = payload?.room;

            if (!room) { cb?.({ status: "error" }); return; }

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, `sticker-${tipo}`, room]
                });

                broadcastMessage(io, socket, { id, type: `sticker-${tipo}`, content, timestamp, user, room }, room);
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR STICKER:", e);
            }
        });

        socket.on("GIF en Chat", async (payload, cb) => {
            const id = generateId();
            const content = payload?.url || "";
            const timestamp = Date.now();
            const room = payload?.room;

            if (!room) { cb?.({ status: "error" }); return; }

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "gif", room]
                });

                broadcastMessage(io, socket, { id, type: "gif", content, timestamp, user, room }, room);
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR GIF:", e);
            }
        });

        socket.on("Editar Mensaje", async (payload, cb) => {
            const { messageId, newContent } = payload;
            if (!messageId || !newContent) return;

            try {
                const existing = await db.execute({
                    sql: "SELECT user FROM Mensajes WHERE id = ?",
                    args: [messageId]
                });

                if (!existing.rows.length || existing.rows[0].user !== user) {
                    cb?.({ status: "error", error: "No autorizado" });
                    return;
                }

                await db.execute({
                    sql: "UPDATE Mensajes SET content = ?, edited = 1 WHERE id = ?",
                    args: [newContent, messageId]
                });

                const msg = await db.execute({ sql: "SELECT room FROM Mensajes WHERE id = ?", args: [messageId] });
                if (msg.rows.length) {
                    io.to(msg.rows[0].room).emit("Mensaje Editado", { messageId, newContent });
                }
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR EDITAR:", e);
            }
        });

        socket.on("Eliminar Mensaje", async (payload, cb) => {
            const { messageId } = payload;

            try {
                const existing = await db.execute({
                    sql: "SELECT user, room FROM Mensajes WHERE id = ?",
                    args: [messageId]
                });

                if (!existing.rows.length || existing.rows[0].user !== user) {
                    cb?.({ status: "error" });
                    return;
                }

                await db.execute({
                    sql: "UPDATE Mensajes SET content = '[eliminado]', type = 'deleted' WHERE id = ?",
                    args: [messageId]
                });

                io.to(existing.rows[0].room).emit("Mensaje Eliminado", { messageId });
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR ELIMINAR:", e);
            }
        });

        socket.on("Reacción", async (payload, cb) => {
            const { messageId, emoji } = payload;

            try {
                const existing = await db.execute({
                    sql: "SELECT id FROM Reacciones WHERE messageId = ? AND emoji = ? AND user = ?",
                    args: [messageId, emoji, user]
                });

                let action;
                if (existing.rows.length) {
                    await db.execute({
                        sql: "DELETE FROM Reacciones WHERE messageId = ? AND emoji = ? AND user = ?",
                        args: [messageId, emoji, user]
                    });
                    action = "remove";
                } else {
                    await db.execute({
                        sql: "INSERT INTO Reacciones VALUES (?, ?, ?, ?, ?)",
                        args: [generateId(), messageId, emoji, user, Date.now()]
                    });
                    action = "add";
                }

                const msg = await db.execute({ sql: "SELECT room FROM Mensajes WHERE id = ?", args: [messageId] });
                if (msg.rows.length) {
                    io.to(msg.rows[0].room).emit("Reacción Actualizada", { messageId, emoji, user, action });
                }
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR REACCIÓN:", e);
            }
        });

        socket.on("Escribiendo", ({ typing, room }) => {
            if (room) {
                socket.to(room).emit("Usuario Escribiendo", { user, typing });
            }
        });

        socket.on("Mensaje Leído", async ({ messageId }) => {
            if (!messageId) return;
            
            try {
                const existing = await db.execute({
                    sql: "SELECT id FROM Visto WHERE messageId = ? AND user = ?",
                    args: [messageId, user]
                });
                
                if (!existing.rows.length) {
                    await db.execute({
                        sql: "INSERT INTO Visto (id, messageId, user, timestamp) VALUES (?, ?, ?, ?)",
                        args: [generateId(), messageId, user, Date.now()]
                    });
                }
                
                const allViews = await db.execute({
                    sql: "SELECT user FROM Visto WHERE messageId = ?",
                    args: [messageId]
                });
                
                const viewers = allViews.rows.map(r => r.user);
                
                const msg = await db.execute({ sql: "SELECT room FROM Mensajes WHERE id = ?", args: [messageId] });
                if (msg.rows.length) {
                    io.to(msg.rows[0].room).emit("Estado Leído", { messageId, user, viewers });
                }
            } catch (e) {
                console.error("❌ ERROR VISTO:", e);
            }
        });

        socket.on("Cargar mensajes anteriores", async ({ beforeTimestamp, room } = {}, cb) => {
            if (!beforeTimestamp || !room) { cb?.({ status: "error" }); return; }

            try {
                const results = await db.execute({
                    sql: `SELECT * FROM Mensajes WHERE timestamp < ? AND room = ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                    args: [beforeTimestamp, room]
                });

                const rows = [...results.rows].reverse().map(row => ({
                    id: row.id,
                    type: row.type || "text",
                    content: row.content,
                    timestamp: row.timestamp,
                    user: row.user || "Anonimo",
                    replyToId: row.replyToId || null,
                    replyToUser: row.replyToUser || null,
                    replyToContent: row.replyToContent || null,
                    edited: Number(row.edited) === 1,
                    room: row.room
                }));

                let hasMore = false;
                if (rows.length > 0) {
                    const older = await db.execute({
                        sql: "SELECT 1 FROM Mensajes WHERE timestamp < ? AND room = ? LIMIT 1",
                        args: [rows[0].timestamp, room]
                    });
                    hasMore = older.rows.length > 0;
                }

                cb?.({ status: "ok", messages: rows, hasMore });
            } catch (e) {
                console.error("❌ ERROR PAGINACIÓN:", e);
                cb?.({ status: "error" });
            }
        });

        socket.on("Subir Canción", async (payload, cb) => {
            const { titulo, artista, tipo, contenido, portada } = payload;
            if (!titulo || !tipo || !contenido) return;

            const id = generateId();
            const timestamp = Date.now();

            try {
                await db.execute({
                    sql: "INSERT INTO Canciones (id, titulo, artista, tipo, contenido, portada, usuario, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    args: [id, titulo, artista || "Desconocido", tipo, contenido, portada || null, user, timestamp]
                });

                io.emit("Canción Agregada", { id, titulo, artista: artista || "Desconocido", tipo, contenido, portada: portada || null, usuario: user, timestamp });
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR CANCIÓN:", e);
                cb?.({ status: "error" });
            }
        });

        socket.on("Eliminar Canción", async ({ cancionId }, cb) => {
            try {
                await db.execute({ sql: "DELETE FROM Canciones WHERE id = ?", args: [cancionId] });
                io.emit("Canción Eliminada", { cancionId });
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR ELIMINAR CANCIÓN:", e);
            }
        });

        socket.on("llamada:invite", ({ to, type }) => {
            const toSocketId = userSockets.get(to);
            if (!toSocketId) {
                socket.emit("llamada:reject", { from: to, reason: "Usuario no encontrado" });
                return;
            }
            const callId = `call-${Date.now()}`;
            io.to(toSocketId).emit("llamada:invite", { from: user, type, callId, fromSocketId: socket.id });
            console.log(`📞 Invites enviado: ${user} -> ${to}`);
        });

        socket.on("llamada:accept", ({ to, callId }) => {
            const toSocketId = userSockets.get(to);
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:accept", { from: user, callId });
                socket.emit("llamada:accept", { from: to, callId });
                console.log(`📞 Llamada aceptada: ${user} <-> ${to}`);
            }
        });

        socket.on("llamada:reject", ({ to }) => {
            const toSocketId = userSockets.get(to);
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:reject", { from: user });
            }
        });

        socket.on("llamada:end", ({ to }) => {
            const toSocketId = userSockets.get(to);
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:end", { from: user });
            }
            console.log(`📞 Llamada terminada: ${user} -> ${to}`);
        });

        socket.on("llamada:offer", ({ offer, to }) => {
            const toSocketId = userSockets.get(to);
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:offer", { offer, from: user });
            }
        });

        socket.on("llamada:answer", ({ answer, to }) => {
            const toSocketId = userSockets.get(to);
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:answer", { answer, from: user });
            }
        });

        socket.on("llamada:ice", ({ candidate, to }) => {
            const toSocketId = userSockets.get(to);
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:ice", { candidate, from: user });
            }
        });
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

    server.listen(port, () => console.log(`🚀 Server corriendo en puerto ${port}`));
}

init();