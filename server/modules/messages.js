// ============================================
// 💬 MESSAGES MODULE - Send, edit, delete, reactions
// Archivo: server/modules/messages.js
// ============================================

import { db } from "./database.js";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper para emitir mensaje a la sala
function emitMessage(io, socket, room, payload) {
    io.to(room).emit("Mensaje en Chat", payload);
    socket.broadcast.to(room).emit("Mensaje en Chat", payload);
}

export async function setupMessages(io, socket, connectedUsers, isAdmin, userRoom) {
    // Auto-login si no está en connectedUsers
    if (!connectedUsers.get(socket.id)) {
        const auth = socket.handshake.auth;
        const nombre = auth?.NombreUsuario || auth?.nombre;
        if (nombre?.trim()) {
            try {
                const result = await db.execute({
                    sql: "SELECT avatar FROM Usuarios WHERE nombre = ?",
                    args: [nombre]
                });
                const avatar = result.rows[0]?.avatar || null;
                connectedUsers.set(socket.id, { nombre: nombre.trim(), avatar, sala: null });
                
            } catch { /* ignore */ }
        }
    }

    // ---- MENSAJE EN CHAT ----
    socket.on("Mensaje en Chat", async (payload, cb) => {
        const currentUser = connectedUsers.get(socket.id);
        if (!currentUser) {
            cb?.({ status: "error", message: "No logueado" });
            return;
        }
        
        const { content, msg, replyToId, replyToUser, replyToContent, destructSeconds, room: payloadRoom } = payload;
        const id = generateId();
        const timestamp = Date.now();
        const room = payloadRoom || userRoom || null;
        const messageContent = content || msg || "";

        // Unir socket a la sala si no está
        if (!socket.rooms.has(room)) {
            socket.join(room);
        }

        // Emitir INMEDIATO al cliente (más rápido)
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

        // Guardar en DB en background (fire & forget)
        db.execute({
            sql: `INSERT INTO Mensajes (id, content, user, timestamp, type, replyToId, replyToUser, replyToContent, edited, destructSeconds, room)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [id, messageContent, currentUser.nombre, timestamp, "text", replyToId || null, replyToUser || null, replyToContent || null, 0, destructSeconds || 0, room]
        }).catch(e => console.error("❌ Error guardando mensaje:", e));
    });

    // ---- IMAGEN EN CHAT ----
    socket.on("Imagen en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || userRoom || null;

        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.data, user.nombre, timestamp, "image", room]
            });

            emitMessage(io, socket, room, { id, type: "image", content: payload.data, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- VIDEO EN CHAT ----
    socket.on("Video en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || userRoom || null;

        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.data, user.nombre, timestamp, "video", room]
            });

            emitMessage(io, socket, room, { id, type: "video", content: payload.data, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- AUDIO EN CHAT ----
    socket.on("Audio en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || userRoom || null;

        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.data, user.nombre, timestamp, "audio", room]
            });

            emitMessage(io, socket, room, { id, type: "audio", content: payload.data, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- STICKER EN CHAT ----
    socket.on("Sticker en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || userRoom || null;

        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.content, user.nombre, timestamp, "sticker", room]
            });

            emitMessage(io, socket, room, { id, type: "sticker", content: payload.content, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- GIF EN CHAT ----
    socket.on("GIF en Chat", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const id = generateId();
        const timestamp = Date.now();
        const room = payload.room || userRoom || null;

        try {
            await db.execute({
                sql: "INSERT INTO Mensajes (id, content, user, timestamp, type, room) VALUES (?, ?, ?, ?, ?, ?)",
                args: [id, payload.url, user.nombre, timestamp, "gif", room]
            });

            emitMessage(io, socket, room, { id, type: "gif", content: payload.url, timestamp, user: user.nombre, room });
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- EDITAR MENSAJE ----
    socket.on("Editar Mensaje", async ({ messageId, newContent }, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        try {
            await db.execute({
                sql: "UPDATE Mensajes SET content = ?, edited = 1 WHERE id = ? AND user = ?",
                args: [newContent, messageId, user.nombre]
            });

            io.to(userRoom).emit("Mensaje Editado", { messageId, newContent });
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- ELIMINAR MENSAJE ----
    socket.on("Eliminar Mensaje", async ({ messageId }, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        try {
            await db.execute({
                sql: "DELETE FROM Mensajes WHERE id = ? AND user = ?",
                args: [messageId, user.nombre]
            });

            io.to(userRoom).emit("Mensaje Eliminado", { messageId });
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- REACCIÓN ----
    socket.on("Reacción", async ({ messageId, emoji, action }, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        try {
            if (action === "add") {
                const id = generateId();
                await db.execute({
                    sql: "INSERT INTO Reacciones (id, messageId, emoji, user, timestamp) VALUES (?, ?, ?, ?, ?)",
                    args: [id, messageId, emoji, user.nombre, Date.now()]
                });
            } else {
                await db.execute({
                    sql: "DELETE FROM Reacciones WHERE messageId = ? AND emoji = ? AND user = ?",
                    args: [messageId, emoji, user.nombre]
                });
            }

            const result = await db.execute({
                sql: "SELECT emoji, user FROM Reacciones WHERE messageId = ?",
                args: [messageId]
            });

            const reactions = {};
            result.rows.forEach(r => {
                if (!reactions[r.emoji]) reactions[r.emoji] = [];
                reactions[r.emoji].push(r.user);
            });

            io.to(userRoom).emit("Reacción Actualizada", { messageId, emoji, user: user.nombre, action, reactions });
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });
}

export default { setupMessages };