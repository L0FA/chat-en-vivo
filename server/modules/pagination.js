// ============================================
// 📄 PAGINATION MODULE - Load older messages
// Archivo: server/modules/pagination.js
// ============================================

import { db } from "./database.js";

const PAGE_SIZE = 20;

export async function setupPagination(io, socket, connectedUsers, isAdmin, userRoom) {
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
                connectedUsers.set(socket.id, { nombre: nombre.trim(), avatar, sala: "sala-global" });
            } catch { /* ignore */ }
        }
    }

    // ---- CARGAR MENSAJES ANTERIORES ----
    socket.on("Cargar mensajes anteriores", async ({ beforeTimestamp, room } = {}, cb) => {
        if (!beforeTimestamp) { cb?.({ status: "error" }); return; }
        const queryRoom = room || userRoom;

        try {
            let results;
            // Cargar mensajes filtrados por sala
            results = await db.execute({
                sql: `SELECT * FROM Mensajes WHERE timestamp < ? AND room = ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                args: [beforeTimestamp, queryRoom]
            });
            
            const rows = [...results.rows].reverse();
            
            // Batch query para avatares
            const uniqueUsers = [...new Set(rows.map(r => r.user).filter(Boolean))];
            let avatarMap = {};
            if (uniqueUsers.length > 0) {
                const placeholders = uniqueUsers.map(() => "?").join(",");
                const avatarResults = await db.execute({
                    sql: `SELECT nombre, avatar FROM Usuarios WHERE nombre IN (${placeholders})`,
                    args: uniqueUsers
                });
                for (const row of avatarResults.rows) {
                    avatarMap[row.nombre] = row.avatar;
                }
            }
            
            const messagePayloads = rows.map(row => ({
                id: row.id,
                type: row.type || "text",
                content: row.content,
                timestamp: row.timestamp,
                user: row.user || "Invitado",
                senderAvatar: avatarMap[row.user] || null,
                replyToId: row.replyToId || null,
                replyToUser: row.replyToUser || null,
                edited: Number(row.edited) === 1,
                destructSeconds: row.destructSeconds || 0,
                room: row.room || null
            }));

            let hasMore = false;
            if (rows.length > 0) {
                const older = await db.execute({
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

            cb?.({ status: "ok", messages: messagePayloads, hasMore });
        } catch (e) {
            console.error("❌ ERROR PAGINACIÓN:", e);
            cb?.({ status: "error" });
        }
    });

    // ---- CARGAR MENSAJES POR SALA ----
    // eslint-disable-next-line no-unused-vars
    socket.on("Cargar Mensajes Sala", async ({ room }, _cb) => {
        try {
            // Unir socket a la sala
            if (room && !socket.rooms.has(room)) {
                socket.join(room);
            }
            
            let results;
            if (room === "sala-admins-global" && isAdmin) {
                results = await db.execute({
                    sql: `SELECT * FROM Mensajes ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                    args: []
                });
            } else {
                results = await db.execute({
                    sql: `SELECT * FROM Mensajes WHERE room = ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                    args: [room]
                });
            }
            
            const rows = [...results.rows].reverse();
            
            // Batch query para avatares
            const uniqueUsers = [...new Set(rows.map(r => r.user).filter(Boolean))];
            let avatarMap = {};
            if (uniqueUsers.length > 0) {
                const placeholders = uniqueUsers.map(() => "?").join(",");
                const avatarResults = await db.execute({
                    sql: `SELECT nombre, avatar FROM Usuarios WHERE nombre IN (${placeholders})`,
                    args: uniqueUsers
                });
                for (const row of avatarResults.rows) {
                    avatarMap[row.nombre] = row.avatar;
                }
            }
            
            for (const row of rows) {
                socket.emit("Mensaje en Chat", {
                    id: row.id,
                    type: row.type || "text",
                    content: row.content,
                    timestamp: row.timestamp,
                    user: row.user || "Invitado",
                    senderAvatar: avatarMap[row.user] || null,
                    replyToId: row.replyToId || null,
                    replyToUser: row.replyToUser || null,
                    replyToContent: row.replyToContent || null,
                    edited: Number(row.edited) === 1,
                    destructSeconds: row.destructSeconds || 0,
                    room: row.room || null
                });
            }

            let hasMore = false;
            if (rows.length > 0) {
                let older;
                if (isAdmin && room === "sala-admins-global") {
                    older = await db.execute({
                        sql: "SELECT 1 FROM Mensajes WHERE timestamp < ? LIMIT 1",
                        args: [rows[0].timestamp]
                    });
                    hasMore = older.rows.length > 0;
                } else {
                    older = await db.execute({
                        sql: "SELECT 1 FROM Mensajes WHERE timestamp < ? AND room = ? LIMIT 1",
                        args: [rows[0].timestamp, room]
                    });
                    hasMore = older.rows.length > 0;
                }
            }

            socket.emit("historial cargado", { hasMore, pageSize: PAGE_SIZE });
        } catch (e) {
            console.error("❌ Error al cargar mensajes:", e);
        }
    });
}

export default { setupPagination };