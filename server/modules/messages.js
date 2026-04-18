// ============================================
// 💬 MESSAGES MODULE - Send, edit, delete, reactions
// Archivo: server/modules/messages.js
// ============================================

import { db } from "./database.js";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper para emitir mensaje a la sala
function emitMessage(io, socket, room, payload) {
    io.to(room).emit("Mensaje en Chat", payload);
}

export async function setupMessages(io, socket, connectedUsers) {
    // Helper para chequeo de seguridad en media
    const checkAdminRoomAccess = (room, userNombre) => {
        const ADMIN_LIST = (process.env.ADMINS || "").split(",").map(a => a.trim().toLowerCase()).filter(Boolean);
        if (room === "sala-admins-global" && !ADMIN_LIST.includes(userNombre.toLowerCase())) {
            return false;
        }
        return true;
    };

    // ---- MENSAJE EN CHAT ----
    socket.on("Mensaje en Chat", async (payload, cb) => {
        let currentUser = connectedUsers.get(socket.id);
        
        if (!currentUser) {
            const auth = socket.handshake.auth;
            const nombre = auth?.NombreUsuario || auth?.nombre;
            if (nombre?.trim()) {
                try {
                    const result = await db.execute({
                        sql: "SELECT avatar FROM Usuarios WHERE nombre = ?",
                        args: [nombre]
                    });
                    const avatar = result.rows[0]?.avatar || null;
                    currentUser = { nombre: nombre.trim(), avatar, sala: null };
                    connectedUsers.set(socket.id, currentUser);
                } catch { /* ignore */ }
            }
        }

        if (!currentUser) {
            cb?.({ status: "error", message: "No logueado" });
            return;
        }
        
        const { content, msg, replyToId, replyToUser, replyToContent, destructSeconds, room: payloadRoom } = payload;
        const id = generateId();
        const timestamp = Date.now();
        const room = payloadRoom || currentUser.sala || "sala-global";
        const messageContent = content || msg || "";

        // --- SEGURIDAD: Bloquear envío a sala Admin si no es admin ---
        if (!checkAdminRoomAccess(room, currentUser.nombre)) {
            console.log(`🚫 [SECURITY] Bloqueado envío de mensaje a sala admin por: ${currentUser.nombre}`);
            return cb?.({ status: "error", message: "No tenés permiso para escribir acá" });
        }

        // Unir socket a la sala si no está
        if (!socket.rooms.has(room)) {
            socket.join(room);
        }

        const messagePayload = {
            id, content: messageContent, timestamp, user: currentUser.nombre,
            senderAvatar: currentUser.avatar,
            replyToId: replyToId || null,
            replyToUser: replyToUser || null,
            replyToContent: replyToContent || null,
            edited: false, destructSeconds: destructSeconds || 0, room
        };

        emitMessage(io, socket, room, messagePayload);
        cb?.({ status: "ok", id });

        try {
            await db.execute({
                sql: `INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, replyToContent, edited, destructSeconds, room)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [id, messageContent, currentUser.nombre, timestamp, "text", replyToId || null, replyToUser || null, replyToContent || null, 0, destructSeconds || 0, room]
            });
        } catch (e) {
            console.error("❌ Error guardando mensaje:", e.message, "id:", id);
        }
    });

    // ---- IMAGEN EN CHAT ----
    socket.on("Imagen en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || user.sala || "sala-global";
        if (!checkAdminRoomAccess(room, user.nombre)) return cb?.({ status: "error" });
        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.data, user.nombre, timestamp, "image", room]
            });
            emitMessage(io, socket, room, { id, type: "image", content: payload.data, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch { cb?.({ status: "error" }); }
    });

    // ---- VIDEO EN CHAT ----
    socket.on("Video en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || user.sala || "sala-global";
        if (!checkAdminRoomAccess(room, user.nombre)) return cb?.({ status: "error" });
        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.data, user.nombre, timestamp, "video", room]
            });
            emitMessage(io, socket, room, { id, type: "video", content: payload.data, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch { cb?.({ status: "error" }); }
    });

    // ---- AUDIO EN CHAT ----
    socket.on("Audio en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || user.sala || "sala-global";
        if (!checkAdminRoomAccess(room, user.nombre)) return cb?.({ status: "error" });
        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.data, user.nombre, timestamp, "audio", room]
            });
            emitMessage(io, socket, room, { id, type: "audio", content: payload.data, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch { cb?.({ status: "error" }); }
    });

    // ---- STICKER EN CHAT ----
    socket.on("Sticker en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || user.sala || "sala-global";
        if (!checkAdminRoomAccess(room, user.nombre)) return cb?.({ status: "error" });
        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.content, user.nombre, timestamp, "sticker", room]
            });
            emitMessage(io, socket, room, { id, type: "sticker", content: payload.content, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch { cb?.({ status: "error" }); }
    });

    // ---- GIF EN CHAT ----
    socket.on("GIF en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || user.sala || "sala-global";
        if (!checkAdminRoomAccess(room, user.nombre)) return cb?.({ status: "error" });
        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.url, user.nombre, timestamp, "gif", room]
            });
            emitMessage(io, socket, room, { id, type: "gif", content: payload.url, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch { cb?.({ status: "error" }); }
    });

    // ---- EDITAR MENSAJE ----
    socket.on("Editar Mensaje", async ({ messageId, newContent }, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        try {
            const msgCheck = await db.execute({ sql: "SELECT room FROM Mensajes WHERE id = ?", args: [messageId] });
            const room = msgCheck.rows[0]?.room || "sala-global";
            if (!checkAdminRoomAccess(room, user.nombre)) return cb?.({ status: "error" });

            await db.execute({
                sql: "UPDATE Mensajes SET content = ?, edited = 1 WHERE id = ? AND user = ?",
                args: [newContent, messageId, user.nombre]
            });
            io.to(room).emit("Mensaje Editado", { messageId, newContent });
            cb?.({ status: "ok" });
        } catch { cb?.({ status: "error" }); }
    });

    // ---- ELIMINAR MENSAJE ----
    socket.on("Eliminar Mensaje", async ({ messageId, room }, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return cb?.({ status: "error" });
        const ADMIN_LIST = (process.env.ADMINS || "").split(",").map(a => a.trim().toLowerCase()).filter(Boolean);
        const isAdmin = ADMIN_LIST.includes(user.nombre.toLowerCase());
        const targetRoom = room || user.sala || "sala-global";
        if (!checkAdminRoomAccess(targetRoom, user.nombre)) return cb?.({ status: "error" });
        try {
            if (isAdmin) {
                await db.execute({ sql: "DELETE FROM Mensajes WHERE id = ?", args: [messageId] });
            } else {
                await db.execute({ sql: "DELETE FROM Mensajes WHERE id = ? AND user = ?", args: [messageId, user.nombre] });
            }
            io.to(targetRoom).emit("Mensaje Eliminado", { messageId });
            cb?.({ status: "ok" });
        } catch (e) { cb?.({ status: "error" }); }
    });

    // ---- REACCIÓN ----
    socket.on("Reacción", async ({ messageId, emoji, action }, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        try {
            const msgCheck = await db.execute({ sql: "SELECT room FROM Mensajes WHERE id = ?", args: [messageId] });
            const room = msgCheck.rows[0]?.room || "sala-global";
            if (!checkAdminRoomAccess(room, user.nombre)) return cb?.({ status: "error" });

            if (action === "add") {
                await db.execute({
                    sql: "INSERT INTO Reacciones (id, messageId, emoji, user, timestamp) VALUES (?, ?, ?, ?, ?)",
                    args: [generateId(), messageId, emoji, user.nombre, Date.now()]
                });
            } else {
                await db.execute({ sql: "DELETE FROM Reacciones WHERE messageId = ? AND emoji = ? AND user = ?", args: [messageId, emoji, user.nombre] });
            }
            const result = await db.execute({ sql: "SELECT emoji, user FROM Reacciones WHERE messageId = ?", args: [messageId] });
            const reactions = {};
            result.rows.forEach(r => {
                if (!reactions[r.emoji]) reactions[r.emoji] = [];
                reactions[r.emoji].push(r.user);
            });
            io.to(room).emit("Reacción Actualizada", { messageId, emoji, user: user.nombre, action, reactions });
            cb?.({ status: "ok" });
        } catch { cb?.({ status: "error" }); }
    });
}

export default { setupMessages };