// ============================================
// 📄 PAGINATION MODULE - Load older messages
// Archivo: server/modules/pagination.js
// ============================================

import { db } from "./database.js";

const PAGE_SIZE = 20;

export async function setupPagination(io, socket, connectedUsers) {
    // ---- CARGAR MENSAJES ANTERIORES ----
    socket.on("Cargar mensajes anteriores", async ({ beforeTimestamp, room } = {}, cb) => {
        if (!beforeTimestamp) { cb?.({ status: "error" }); return; }
        const user = connectedUsers.get(socket.id);
        const queryRoom = room || user?.sala || "sala-global";

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
    socket.on("Cargar Mensajes Sala", async ({ room }, _cb) => {
        const currentUser = connectedUsers.get(socket.id);
        const adminList = (process.env.ADMINS || "").split(",").map(a => a.trim().toLowerCase()).filter(Boolean);
        const isHardcodedAdmin = currentUser && adminList.includes(currentUser.nombre.toLowerCase());
        
        console.log(`📥 [PAGINATION] Cargar Mensajes de sala: ${room} para usuario: ${currentUser?.nombre || "N/A"}`);

        try {
            // Unir socket a la sala
            if (room && !socket.rooms.has(room)) socket.join(room);
            
            // 1. Detección robusta de Admin en paralelo con la búsqueda de mensajes si el ID es conocido
            let isAuthorizedAdmin = isHardcodedAdmin;
            
            if (room === "sala-admins-global" && currentUser) {
                const adminCheck = await db.execute({
                    sql: "SELECT esAdmin FROM MiembrosSala WHERE salaId = ? AND usuario = ?",
                    args: ["sala-admins-global", currentUser.nombre]
                });
                isAuthorizedAdmin = isHardcodedAdmin || (adminCheck.rows.length > 0 && adminCheck.rows[0].esAdmin === 1);
            }

            // 2. Ejecutar búsqueda de mensajes
            let results;
            if (room === "sala-admins-global" && isAuthorizedAdmin) {
                results = await db.execute({
                    sql: `SELECT * FROM Mensajes ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                    args: []
                });
            } else {
                results = await db.execute({
                    sql: `SELECT * FROM Mensajes WHERE room = ? ORDER BY timestamp DESC LIMIT ${PAGE_SIZE}`,
                    args: [room || "sala-global"]
                });
            }

            const rows = [...results.rows].reverse();
            
            // 3. Obtener avatares y verificar 'hasMore' en paralelo
            const uniqueUsers = [...new Set(rows.map(r => r.user).filter(Boolean))];
            
            const [avatarResults, olderCheck] = await Promise.all([
                uniqueUsers.length > 0 
                  ? db.execute({ sql: `SELECT nombre, avatar FROM Usuarios WHERE nombre IN (${uniqueUsers.map(() => "?").join(",")})`, args: uniqueUsers })
                  : Promise.resolve({ rows: [] }),
                rows.length > 0
                  ? db.execute({ sql: "SELECT 1 FROM Mensajes WHERE timestamp < ? AND room = ? LIMIT 1", args: [rows[0].timestamp, room || "sala-global"] })
                  : Promise.resolve({ rows: [] })
            ]);

            const avatarMap = {};
            avatarResults.rows.forEach(r => avatarMap[r.nombre] = r.avatar);
            
            const messages = rows.map(row => ({
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
            }));

            const hasMore = olderCheck.rows.length > 0;

            // 4. EMISIÓN EN LOTE (Single emit instead of N emits)
            socket.emit("historial total", { 
                room,
                messages, 
                hasMore, 
                pageSize: PAGE_SIZE 
            });

            // Callback de confirmación
            _cb?.({ status: "ok", count: messages.length });

        } catch (e) {
            console.error("❌ Error al cargar mensajes:", e);
            _cb?.({ status: "error" });
        }
    });
}

export default { setupPagination };