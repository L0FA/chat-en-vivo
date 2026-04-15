// ============================================
// 📄 PAGINATION MODULE - Load older messages
// Archivo: server/modules/pagination.js
// ============================================

import { db } from "./database.js";

const PAGE_SIZE = 20;

export function setupPagination(io, socket, connectedUsers, isAdmin, userRoom) {
    // ---- CARGAR MENSAJES ANTERIORES ----
    socket.on("Cargar mensajes anteriores", async ({ beforeTimestamp, room } = {}, cb) => {
        if (!beforeTimestamp) { cb?.({ status: "error" }); return; }
        const queryRoom = room || userRoom;

        try {
            let results;
            if (isAdmin && queryRoom === "sala-admins-global") {
                results = await db.execute({
                    sql: `SELECT * FROM Mensajes WHERE timestamp < ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                    args: [beforeTimestamp]
                });
            } else {
                results = await db.execute({
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
            if (isAdmin && room === "sala-admins-global") {
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
            rows.forEach(row => {
                socket.emit("Mensaje en Chat", {
                    id: row.id,
                    type: row.type || "text",
                    content: row.content,
                    timestamp: row.timestamp,
                    user: row.user || "Invitado",
                    replyToId: row.replyToId || null,
                    replyToUser: row.replyToUser || null,
                    replyToContent: row.replyToContent || null,
                    edited: Number(row.edited) === 1,
                    destructSeconds: row.destructSeconds || 0,
                    room: row.room || null
                });
            });

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