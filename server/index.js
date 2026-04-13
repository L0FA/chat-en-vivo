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

const broadcastMessage = (socket, payload) => {
    socket.emit("Mensaje en Chat", payload);
    socket.broadcast.emit("Mensaje en Chat", payload);
};

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
    maxHttpBufferSize: 1e9 // 1GB
});

const callState = createCallState(io);

const db = createClient({
    url: process.env.DB_URL,
    authToken: process.env.DB_TOKEN,
});

const connectedUsers = new Map();

async function init() {

    // ---- TABLAS ----
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Usuarios (
            nombre TEXT PRIMARY KEY,
            avatar TEXT,
            creado INTEGER NOT NULL
        )
    `);

    // Agregar admins por defecto si no existen
    const ADMINS = ["Testing", "La Compu Del Admin", "Anonimo", "Wachin", "usuariorosa"];
    const APP_START_DATE = new Date("2026-04-01").getTime();
    for (const admin of ADMINS) {
        await db.execute({
            sql: "INSERT OR IGNORE INTO Usuarios (nombre, avatar, creado) VALUES (?, ?, ?)",
            args: [admin, null, APP_START_DATE]
        });
    }

    await db.execute(`
        CREATE TABLE IF NOT EXISTS Mensajes (
            id TEXT PRIMARY KEY,
            content TEXT,
            user TEXT,
            timestamp INTEGER,
            type TEXT,
            replyToId TEXT,
            replyToUser TEXT,
            edited INTEGER DEFAULT 0,
            destructSeconds INTEGER DEFAULT 0
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

    // Crear sala de admins si no existe
    const SALA_ADMINS_ID = "sala-admins-global";
    const ADMINS_LIST = ADMINS;
    
    try {
        const existingSala = await db.execute({ sql: "SELECT id FROM Salas WHERE id = ?", args: [SALA_ADMINS_ID] });
        if (!existingSala.rows.length) {
            const timestamp = Date.now();
            await db.execute({
                sql: "INSERT INTO Salas (id, nombre, descripcion, dueno, creado, esPrivada) VALUES (?, ?, ?, ?, ?, ?)",
                args: [SALA_ADMINS_ID, "💎 Sala de Admins", "Sala exclusiva para admins", "La Compu Del Admin", timestamp, 1]
            });
            console.log("✅ Sala de Admins creada");
        }
        
        // Asegurar miembros
        const timestamp = Date.now();
        for (const admin of ADMINS_LIST) {
            await db.execute({
                sql: "INSERT OR REPLACE INTO MiembrosSala (salaId, usuario, rol, esAdmin, joinedAt) VALUES (?, ?, ?, ?, ?)",
                args: [SALA_ADMINS_ID, admin, "admin", 1, timestamp]
            });
        }
        console.log("✅ Miembros de sala de admins asegurados");
        
        // Migrar TODOS los mensajes existentes a sala de admins
        await db.execute({
            sql: "UPDATE Mensajes SET room = ? WHERE room IS NULL OR room = ''",
            args: [SALA_ADMINS_ID]
        });
        console.log("✅ Mensajes migrados a sala de admins");
        
        // Crear sala privada para cada usuario existente
        const allUsers = await db.execute({ sql: "SELECT nombre FROM Usuarios", args: [] });
        for (const row of allUsers.rows) {
            const username = row.nombre;
            const privadaId = `privada-${username}`;
            const exists = await db.execute({ sql: "SELECT id FROM Salas WHERE id = ?", args: [privadaId] });
            if (!exists.rows.length) {
                await db.execute({
                    sql: "INSERT INTO Salas (id, nombre, descripcion, dueno, creado, esPrivada) VALUES (?, ?, ?, ?, ?, ?)",
                    args: [privadaId, "💬 Chat contigo", "Tu espacio personal", username, Date.now(), 1]
                });
            }
            await db.execute({
                sql: "INSERT OR REPLACE INTO MiembrosSala (salaId, usuario, rol, joinedAt) VALUES (?, ?, ?, ?)",
                args: [privadaId, username, "owner", Date.now()]
            });
        }
        console.log("✅ Salas privadas creadas");
        
        // Crear sala global si no existe
        const SALA_GLOBAL_ID = "sala-global";
        const globalExists = await db.execute({ sql: "SELECT id FROM Salas WHERE id = ?", args: [SALA_GLOBAL_ID] });
        if (!globalExists.rows.length) {
            await db.execute({
                sql: "INSERT INTO Salas (id, nombre, descripcion, dueno, creado, esPrivada) VALUES (?, ?, ?, ?, ?, ?)",
                args: [SALA_GLOBAL_ID, "🌍 Chat Global", "Chat para todos", "Sistema", Date.now(), 0]
            });
        }
        // Agregar todos los usuarios como miembros de la sala global
        for (const row of allUsers.rows) {
            await db.execute({
                sql: "INSERT OR REPLACE INTO MiembrosSala (salaId, usuario, rol, joinedAt) VALUES (?, ?, ?, ?)",
                args: [SALA_GLOBAL_ID, row.nombre, "member", Date.now()]
            });
        }
        console.log("✅ Sala global creada");
        
    } catch (e) {
        console.error("❌ ERROR-crear-sala-admins:", e);
    }

    // ---- MIGRACIONES ----
    try {
        await db.execute({ sql: "ALTER TABLE Mensajes ADD COLUMN room TEXT", args: [] });
    } catch {"_"}
    try {
        await db.execute({ sql: "ALTER TABLE Mensajes ADD COLUMN edited INTEGER DEFAULT 0", args: [] });
    } catch {"_"}
    try {
        await db.execute({ sql: "ALTER TABLE Mensajes ADD COLUMN destructSeconds INTEGER DEFAULT 0", args: [] });
    } catch {"_"}
    try {
        await db.execute({ sql: "ALTER TABLE Canciones ADD COLUMN portada TEXT", args: [] });
    } catch {"_"}
    

    // ---- SOCKET ----
io.on("connection", async (socket) => {
    const user = socket.handshake.auth?.NombreUsuario || "Invitado";
        
    console.log("🟢 Conectando:", user);

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
    const ADMIN_LIST = (process.env.ADMINS || "Testing,La Compu Del Admin,Anonimo,Wachin,usuariorosa").split(",").map(s => s.trim());

    try {
        const isAdmin = ADMIN_LIST.includes(user);
        const password = socket.handshake.auth?.password || "";

        if (isAdmin && password !== ADMIN_PASSWORD) {
            socket.emit("Admin Password Required", { message: "Necesitás contraseña de admin para entrar con este usuario." });
            socket.disconnect();
            return;
        }

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
            
            // Crear sala privada para el nuevo usuario
            const privadaId = `privada-${user}`;
            await db.execute({
                sql: "INSERT INTO Salas (id, nombre, descripcion, dueno, creado, esPrivada) VALUES (?, ?, ?, ?, ?, ?)",
                args: [privadaId, "💬 Chat contigo", "Tu espacio personal", user, Date.now(), 1]
            });
            await db.execute({
                sql: "INSERT OR REPLACE INTO MiembrosSala (salaId, usuario, rol, joinedAt) VALUES (?, ?, ?, ?)",
                args: [privadaId, user, "owner", Date.now()]
            });
            
            // Agregar a sala global
            await db.execute({
                sql: "INSERT OR REPLACE INTO MiembrosSala (salaId, usuario, rol, joinedAt) VALUES (?, ?, ?, ?)",
                args: ["sala-global", user, "member", Date.now()]
            });
        }
    } catch (e) {
        console.error("❌ ERROR VALIDAR USUARIO:", e);
        socket.emit("Error", { message: "Error al validar usuario" });
        socket.disconnect();
        return;
    }

    const isAdmin = ADMIN_LIST.includes(user);
    // Todos (incluyendo admins) empiezan en sala-global
    // Los admins pueden acceder a sala-admins-global si la eligen
    const userRoom = "sala-global";

        console.log("🟢 Conectado:", user, isAdmin ? "(ADMIN)" : "");

        // Cargar avatar del usuario desde DB
        let userAvatar = null;
        try {
            const userResult = await db.execute({
                sql: "SELECT avatar FROM Usuarios WHERE nombre = ?",
                args: [user]
            });
            if (userResult.rows.length > 0) {
                userAvatar = userResult.rows[0].avatar;
                console.log("📸 Avatar cargado desde DB para", user, ":", userAvatar ? "SÍ" : "NO");
            }
        } catch (e) {
            console.error("❌ ERROR CARGAR AVATAR:", e);
        }

        // Lista de admins: admins conectados + el nuevo si es admin
        let adminsArray = [...connectedUsers.entries()].filter(([_, u]) => u.esAdmin).map(([_, u]) => u.nombre);
        
        // Siempre incluir admins hardcodeados
        adminsArray = [...new Set([...adminsArray, ...ADMIN_LIST])];
        
        if (isAdmin && !adminsArray.includes(user)) {
            adminsArray.push(user);
        }
        
        connectedUsers.set(socket.id, { nombre: user, esAdmin: isAdmin, avatar: userAvatar });
        callState.registerUser(socket.id, user);
        
        // Obtener todos los usuarios con avatares de la DB para enviar a todos
        const allUsersResult = await db.execute({
            sql: "SELECT nombre, avatar FROM Usuarios",
            args: []
        });
        
        const allUsersWithAvatars = allUsersResult.rows.map(row => ({
            nombre: row.nombre,
            avatar: row.avatar
        }));
        
        console.log("📤 Enviando usuarios desde DB (conexión):", allUsersWithAvatars.map(u => `${u.nombre}:${u.avatar ? "✅" : "❌"}`));
        
        io.emit("Usuarios Conectados", { 
            users: allUsersWithAvatars,
            admins: adminsArray 
        });
        socket.emit("Logged In", { user, isAdmin });

        // ---- DISCONNECT ----
        socket.on("disconnect", () => {
            console.log("🔴 Desconectado:", user);
            connectedUsers.delete(socket.id);
            callState.unregisterUser(socket.id);
            const remainingAdmins = [...connectedUsers.entries()].filter(([_, u]) => u.esAdmin).map(([_, u]) => u.nombre);
            io.emit("Usuarios Conectados", { 
                users: [...connectedUsers.values()].map(u => ({ nombre: u.nombre, avatar: u.avatar })), 
                admins: remainingAdmins 
            });
        });

        // ---- ACTUALIZAR AVATAR ----
        socket.on("Actualizar Avatar", async ({ avatar }, cb) => {
            try {
                console.log("📸 Antes de actualizar - avatar:", avatar?.substring(0, 50), "...");
                
                // Usar INSERT OR REPLACE para asegurar que se guarde
                await db.execute({
                    sql: "INSERT OR REPLACE INTO Usuarios (nombre, avatar, creado) VALUES (?, ?, ?)",
                    args: [user, avatar, Date.now()]
                });
                
                // Verificar que se guardó
                const verify = await db.execute({
                    sql: "SELECT avatar FROM Usuarios WHERE nombre = ?",
                    args: [user]
                });
                console.log("📸 Después de actualizar - avatar en DB:", verify.rows[0]?.avatar ? "SÍ" : "NO");
                
                // Actualizar connectedUsers también
                connectedUsers.set(socket.id, { nombre: user, esAdmin, avatar });
                
                // Obtener TODOS los usuarios con sus avatares de la DB
                const allUsersResult = await db.execute({
                    sql: "SELECT nombre, avatar FROM Usuarios",
                    args: []
                });
                
                const allUsersWithAvatars = allUsersResult.rows.map(row => ({
                    nombre: row.nombre,
                    avatar: row.avatar
                }));
                
                console.log("📤 Enviando usuarios con avatares desde DB:", allUsersWithAvatars.map(u => `${u.nombre}:${u.avatar ? "✅" : "❌"}`));
                io.emit("Usuarios Conectados", { 
                    users: allUsersWithAvatars, 
                    admins: adminsArray 
                });
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR ACTUALIZAR AVATAR:", e);
                cb?.({ status: "error" });
            }
        });

        // ---- SALAS ----
        socket.on("Obtener Mis Salas", async (cb) => {
            console.log("📋 Obteniendo salas para:", user);
            try {
                const salas = await db.execute({
                    sql: `SELECT s.*, m.esAdmin FROM Salas s 
                          JOIN MiembrosSala m ON s.id = m.salaId 
                          WHERE m.usuario = ?`,
                    args: [user]
                });
                console.log("📋 Salas encontradas:", salas.rows.length, salas.rows.map(s => s.id));
                cb?.({ status: "ok", salas: salas.rows });
            } catch (e) {
                console.error("❌ ERROR OBTENER SALAS:", e);
                cb?.({ status: "error" });
            }
        });

        // ---- INFO USUARIO ----
        socket.on("Obtener Info Usuario", async ({ targetUser }, cb) => {
            try {
                const result = await db.execute({
                    sql: "SELECT nombre, avatar, creado FROM Usuarios WHERE nombre = ?",
                    args: [targetUser]
                });
                if (result.rows.length > 0) {
                    const u = result.rows[0];
                    const fechaCreado = new Date(u.creado).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
                    cb?.({ status: "ok", info: { nombre: u.nombre, avatar: u.avatar, creado: fechaCreado, timestamp: u.creado } });
                } else {
                    cb?.({ status: "error", error: "Usuario no encontrado" });
                }
            } catch (e) {
                console.error("❌ ERROR INFO USUARIO:", e);
                cb?.({ status: "error" });
            }
        });

        // ---- GLOBAL (solo admins pueden escribir aqui) ----
        socket.on("Mensaje Global", async (payload, cb) => {
            if (!isAdmin) { cb?.({ status: "error", error: "Solo admins" }); return; }
            const id = generateId();
            const { content } = payload || {};
            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, Date.now(), "text", "sala-global"]
                });
                io.emit("Mensaje en Chat", { id, type: "text", content, timestamp: Date.now(), user, room: "sala-global" });
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR GLOBAL:", e);
            }
        });

        // ---- ADMIN: HACER ADMIN ----
        socket.on("Hacer Admin", async ({ targetUser }, cb) => {
            if (!isAdmin) { cb?.({ status: "error", error: "No autorizado" }); return; }
            try {
                const currentAdmins = (process.env.ADMINS || "").split(",").map(s => s.trim());
                if (!currentAdmins.includes(targetUser)) {
                    const newAdmins = [...currentAdmins, targetUser].join(",");
                    // No se puede cambiar .env en runtime, así que emitimos evento a todos los admins
                    io.emit("Nuevo Admin", { usuario: targetUser });
                }
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR HACER ADMIN:", e);
                cb?.({ status: "error" });
            }
        });

        // ---- ADMIN: BANEAR ----
        socket.on("Banear Usuario", async ({ targetUser }, cb) => {
            if (!isAdmin) { cb?.({ status: "error", error: "No autorizado" }); return; }
            try {
                const bannedUser = [...connectedUsers.entries()].find(([_, u]) => u.nombre === targetUser);
                if (bannedUser) {
                    const [socketId] = bannedUser;
                    io.to(socketId).emit("Baneado", { mensaje: "Has sido baneado del chat" });
                    io.sockets.sockets.get(socketId)?.disconnect();
                }
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR BANEAR:", e);
                cb?.({ status: "error" });
            }
        });

        // ---- TEXTO ----
        socket.on("Mensaje en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = typeof payload === "string" ? payload : payload?.msg || "";
            const timestamp = payload?.timestamp || Date.now();
            const replyToId = payload?.replyToId || null;
            const replyToUser = payload?.replyToUser || null;
            const destructSeconds = payload?.destructSeconds || 0;
            const room = payload?.room || userRoom;

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, edited, destructSeconds, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "text", replyToId, replyToUser, 0, destructSeconds, room]
                });

                socket.emit("Mensaje en Chat", { id, type: "text", content, timestamp, user, replyToId, replyToUser, destructSeconds, room });
                socket.broadcast.emit("Mensaje en Chat", { id, type: "text", content, timestamp, user, replyToId, replyToUser, destructSeconds, room });
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR TEXTO:", e);
                cb?.({ status: "error" });
            }
        });

        // ---- IMAGEN ----
        socket.on("Imagen en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const timestamp = payload?.timestamp || Date.now();

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, edited, destructSeconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "image", null, null, 0, 0]
                });

                broadcastMessage(socket, { id, type: "image", content, timestamp, user });
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR IMAGEN:", e);
            }
        });

        // ---- VIDEO ----
        socket.on("Video en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const timestamp = payload?.timestamp || Date.now();

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, edited, destructSeconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "video", null, null, 0, 0]
                });

                broadcastMessage(socket, { id, type: "video", content, timestamp, user });
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR VIDEO:", e);
            }
        });

        // ---- AUDIO ----
        socket.on("Audio en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const timestamp = payload?.timestamp || Date.now();

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, edited, destructSeconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "audio", null, null, 0, 0]
                });

                broadcastMessage(socket, { id, type: "audio", content, timestamp, user });
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR AUDIO:", e);
            }
        });

        // ---- STICKER ----
        socket.on("Sticker en Chat", async (payload, cb) => {
            const id = payload?.id || generateId();
            const content = payload?.data || "";
            const tipo = payload?.tipo || "emoji";
            const timestamp = payload?.timestamp || Date.now();

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, edited, destructSeconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, `sticker-${tipo}`, null, null, 0, 0]
                });

                broadcastMessage(socket, { id, type: `sticker-${tipo}`, content, timestamp, user });
                cb?.({ status: "ok", id });
            } catch (e) {
                console.error("❌ ERROR STICKER:", e);
            }
        });

        // ---- GIF ----
        socket.on("GIF en Chat", async (payload, cb) => {
            const id = generateId();
            const content = payload?.url || "";
            const timestamp = Date.now();

            try {
                await db.execute({
                    sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, edited, destructSeconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    args: [id, content, user, timestamp, "gif", null, null, 0, 0]
                });

                broadcastMessage(socket, { id, type: "gif", content, timestamp, user });
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR GIF:", e);
            }
        });

        // ---- EDITAR ----
        socket.on("Editar Mensaje", async (payload, cb) => {
            const { messageId, newContent } = payload;
            if (!messageId || !newContent) return;

            try {
                const existing = await db.execute({
                    sql: "SELECT user FROM Mensajes WHERE id = ?",
                    args: [messageId]
                });

                if (!existing.rows.length || (existing.rows[0].user !== user && !isAdmin)) {
                    cb?.({ status: "error", error: "No autorizado" });
                    return;
                }

                await db.execute({
                    sql: "UPDATE Mensajes SET content = ?, edited = 1 WHERE id = ?",
                    args: [newContent, messageId]
                });

                io.emit("Mensaje Editado", { messageId, newContent });
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR EDITAR:", e);
            }
        });

        // ---- ELIMINAR ----
        socket.on("Eliminar Mensaje", async (payload, cb) => {
            const { messageId } = payload;

            try {
                const existing = await db.execute({
                    sql: "SELECT user FROM Mensajes WHERE id = ?",
                    args: [messageId]
                });

                if (!existing.rows.length || (existing.rows[0].user !== user && !isAdmin)) {
                    cb?.({ status: "error" });
                    return;
                }

                await db.execute({
                    sql: "UPDATE Mensajes SET content = '[eliminado]', type = 'deleted' WHERE id = ?",
                    args: [messageId]
                });

                io.emit("Mensaje Eliminado", { messageId });
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR ELIMINAR:", e);
            }
        });

        // ---- REACCIONES ----
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

                io.emit("Reacción Actualizada", { messageId, emoji, user, action });
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR REACCIÓN:", e);
            }
        });

        // ---- TYPING ----
        socket.on("Escribiendo", ({ typing }) => {
            socket.broadcast.emit("Usuario Escribiendo", { user, typing });
        });

        // ---- READ ----
        socket.on("Mensaje Leído", ({ messageId }) => {
            socket.broadcast.emit("Estado Leído", { messageId, user });
        });

        // ---- MÚSICA APP ----
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

        socket.on("Sync Música App", (payload) => {
            socket.broadcast.emit("Sync Música App", { ...payload, usuario: user });
        });

        socket.on("Eliminar Canción", async (payload, cb) => {
            const { cancionId } = payload;
            try {
                await db.execute({ sql: "DELETE FROM Canciones WHERE id = ?", args: [cancionId] });
                io.emit("Canción Eliminada", { cancionId });
                cb?.({ status: "ok" });
            } catch (e) {
                console.error("❌ ERROR ELIMINAR CANCIÓN:", e);
            }
        });

        // ---- MÚSICA COMPARTIDA (viejo sistema) ----
        socket.on("Música Compartida", (payload) => {
            const { url, title, platform, action } = payload;
            io.emit("Música Actualizada", { url, title, platform, action, user, timestamp: Date.now() });
        });

        socket.on("Sincronizar Música", (payload) => {
            socket.broadcast.emit("Música Sincronizada", { ...payload, user, timestamp: Date.now() });
        });

        // ---- SELF DESTRUCT ----
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

        // ---- LLAMADAS ----
        socket.on("llamada:invite", ({ to, type }) => {
            const toSocketId = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
            if (!toSocketId) {
                console.log(`❌ Usuario ${to} no encontrado`);
                socket.emit("llamada:reject", { from: to, reason: "Usuario no encontrado" });
                return;
            }
            const callId = `call-${Date.now()}`;
            io.to(toSocketId).emit("llamada:invite", { from: user, type, callId, fromSocketId: socket.id });
            console.log(`📞 Invites enviado: ${user} -> ${to}`);
        });

        socket.on("llamada:accept", ({ to, callId }) => {
            const toSocketId = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:accept", { from: user, callId });
                socket.emit("llamada:accept", { from: to, callId });
                console.log(`📞 Llamada aceptada: ${user} <-> ${to}`);
            }
        });

        socket.on("llamada:reject", ({ to }) => {
            const toSocketId = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:reject", { from: user });
            }
        });

        socket.on("llamada:end", ({ to }) => {
            const toSocketId = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:end", { from: user });
            }
            console.log(`📞 Llamada terminada: ${user} -> ${to}`);
        });

        // ---- WEBRTC ----
        socket.on("llamada:offer", ({ offer, to }) => {
            const toSocketId = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:offer", { offer, from: user });
            }
        });

        socket.on("llamada:answer", ({ answer, to }) => {
            const toSocketId = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:answer", { answer, from: user });
            }
        });

        socket.on("llamada:ice", ({ candidate, to }) => {
            const toSocketId = [...connectedUsers.entries()].find(([, u]) => u === to)?.[0];
            if (toSocketId) {
                io.to(toSocketId).emit("llamada:ice", { candidate, from: user });
            }
        });

        // ---- PAGINACIÓN ----
        socket.on("Cargar mensajes anteriores", async ({ beforeTimestamp, room } = {}, cb) => {
            if (!beforeTimestamp) { cb?.({ status: "error" }); return; }
            const queryRoom = room || userRoom;

            try {
                // Los admins solo cargan más mensajes en la sala de admins
                if (isAdmin && queryRoom === "sala-admins-global") {
                    var results = await db.execute({
                        sql: `SELECT * FROM Mensajes WHERE timestamp < ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                        args: [beforeTimestamp]
                    });
                } else {
                    var results = await db.execute({
                        sql: `SELECT * FROM Mensajes WHERE timestamp < ? AND room = ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                        args: [beforeTimestamp, queryRoom]
                    });
                }

                const rows = [...results.rows].reverse().map(row => ({
                    id: row.id,
                    type: row.type || "text",
                    content: row.content,
                    timestamp: row.timestamp,
                    user: row.user || "Invitado",
                    replyToId: row.replyToId || null,
                    replyToUser: row.replyToUser || null,
                    edited: Number(row.edited) === 1,
                    destructSeconds: row.destructSeconds || 0,
                    room: row.room || null
                }));

                let hasMore = false;
                if (rows.length > 0) {
                    let older;
                    if (isAdmin && queryRoom === "sala-admins-global") {
                        older = await db.execute({
                            sql: "SELECT 1 FROM Mensajes WHERE timestamp < ? LIMIT 1",
                            args: [rows[0].timestamp]
                        });
                        const countResult = await db.execute({ sql: "SELECT COUNT(*) as count FROM Mensajes", args: [] });
                        const totalMessages = countResult.rows[0]?.count || 0;
                        hasMore = older.rows.length > 0 && totalMessages > rows.length;
                    } else {
                        older = await db.execute({
                            sql: "SELECT 1 FROM Mensajes WHERE timestamp < ? AND room = ? LIMIT 1",
                            args: [rows[0].timestamp, queryRoom]
                        });
                        const countResult = await db.execute({
                            sql: "SELECT COUNT(*) as count FROM Mensajes WHERE room = ?",
                            args: [queryRoom]
                        });
                        const totalMessages = countResult.rows[0]?.count || 0;
                        hasMore = older.rows.length > 0 && totalMessages > rows.length;
                    }
                }

                cb?.({ status: "ok", messages: rows, hasMore });
            } catch (e) {
                console.error("❌ ERROR PAGINACIÓN:", e);
                cb?.({ status: "error" });
            }
        });

        // ---- CARGAR MENSAJES POR SALA ----
        socket.on("Cargar Mensajes Sala", async ({ room }, cb) => {
            try {
                let results;
                // Los admins ven todos los mensajes solo en la sala de admins
                if (isAdmin && room === "sala-admins-global") {
                    results = await db.execute({
                        sql: `SELECT * FROM Mensajes ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                        args: []
                    });
                } else {
                    // Todos (incluyendo admins) solo ven mensajes de su sala actual
                    results = await db.execute({
                        sql: `SELECT * FROM Mensajes WHERE room = ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                        args: [room]
                    });
                }
                
                const rows = [...results.rows].reverse();
                rows.forEach(row => {
                    socket.emit("Mensaje en Chat", {
                        id: row.id,
                        type: row.type || "text",
                        content: row.content,
                        timestamp: row.timestamp,
                        user: row.user || "Invitado",
                        replyToId: row.replyToId || null,
                        replyToUser: row.replyToUser || null,
                        edited: Number(row.edited) === 1,
                        destructSeconds: row.destructSeconds || 0,
                        room: row.room || null
                    });
                });

                let hasMore = false;
                if (rows.length > 0) {
                    // Solo buscar si hay más mensajes CON room asignado
                    const countResult = await db.execute({
                        sql: "SELECT COUNT(*) as count FROM Mensajes WHERE room = ?",
                        args: [room]
                    });
                    const totalMessages = countResult.rows[0]?.count || 0;
                    hasMore = totalMessages > rows.length;
                }

                socket.emit("historial cargado", { hasMore, pageSize: PAGE_SIZE });
                cb?.({ status: "ok", count: rows.length });
            } catch (e) {
                console.error("❌ ERROR CARGAR SALA:", e);
                cb?.({ status: "error" });
            }
        });

        // ---- RECUPERACIÓN INICIAL (solo para sala actual) ----
        try {
            let results;
            // TODOS (incluyendo admins) filtran por su sala en la carga inicial
            results = await db.execute({
                sql: `SELECT * FROM Mensajes WHERE room = ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                args: [userRoom]
            });
            
            const initialRows = [...results.rows].reverse();
            initialRows.forEach(row => {
                socket.emit("Mensaje en Chat", {
                    id: row.id,
                    type: row.type || "text",
                    content: row.content,
                    timestamp: row.timestamp,
                    user: row.user || "Invitado",
                    replyToId: row.replyToId || null,
                    replyToUser: row.replyToUser || null,
                    edited: Number(row.edited) === 1,
                    destructSeconds: row.destructSeconds || 0,
                    room: row.room || null
                });
            });

            let hasMore = false;
            if (initialRows.length > 0) {
                const countResult = await db.execute({
                    sql: "SELECT COUNT(*) as count FROM Mensajes WHERE room = ?",
                    args: [userRoom]
                });
                const totalMessages = countResult.rows[0]?.count || 0;
                hasMore = totalMessages > initialRows.length;
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

            // Recuperar canciones
            const canciones = await db.execute("SELECT * FROM Canciones ORDER BY timestamp ASC");
            canciones.rows.forEach(row => {
                socket.emit("Canción Agregada", {
                    id: row.id,
                    titulo: row.titulo,
                    artista: row.artista,
                    tipo: row.tipo,
                    contenido: row.contenido,
                    portada: row.portada || null,
                    usuario: row.usuario,
                    timestamp: row.timestamp
                });
            });

            socket.emit("historial cargado", { hasMore, pageSize: PAGE_SIZE });
        } catch (e) {
            console.error("❌ ERROR RECOVERY:", e);
        }
    });

    // ---- EXPRESS ----
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