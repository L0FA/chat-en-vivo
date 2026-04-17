// ============================================
// 🚪 ROOMS MODULE - Sala creation, joining, invitations
// Archivo: server/modules/rooms.js
// ============================================

import { db } from "./database.js";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function setupRooms(socket, connectedUsers) {
    const user = connectedUsers.get(socket.id);

    // ---- OBTENER MIS SALAS ----
    socket.on("Obtener Mis Salas", async (cb) => {
        if (!user) return;
        try {
            const result = await db.execute({
                sql: `SELECT s.* FROM Salas s 
                      JOIN MiembrosSala sm ON s.id = sm.salaId 
                      WHERE sm.usuario = ?`,
                args: [user.nombre]
            });
            cb?.({ status: "ok", salas: result.rows });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- CREAR SALA ----
    socket.on("Crear Sala", async ({ nombre, descripcion }, cb) => {
        if (!user) return;
        const salaId = generateId();
        
        try {
            await db.execute({
                sql: "INSERT INTO Salas (id, nombre, descripcion, dueno, creado) VALUES (?, ?, ?, ?, ?)",
                args: [salaId, nombre, descripcion || "", user.nombre, Date.now()]
            });
            
            await db.execute({
                sql: "INSERT INTO MiembrosSala (salaId, usuario, rol, esAdmin, joinedAt) VALUES (?, ?, ?, ?, ?)",
                args: [salaId, user.nombre, "owner", 1, Date.now()]
            });
            
            cb?.({ status: "ok", sala: { id: salaId, nombre, descripcion } });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- UNIRSE A SALA ----
    socket.on("Unirse Sala", async ({ salaId }, cb) => {
        if (!user) return;
        
        try {
            await db.execute({
                sql: "INSERT OR IGNORE INTO MiembrosSala (salaId, usuario, rol, esAdmin, joinedAt) VALUES (?, ?, ?, ?, ?)",
                args: [salaId, user.nombre, "miembro", 0, Date.now()]
            });
            
            const salaResult = await db.execute({
                sql: "SELECT * FROM Salas WHERE id = ?",
                args: [salaId]
            });
            
            if (salaResult.rows.length > 0) {
                socket.join(salaId);
                user.sala = salaId;
                cb?.({ status: "ok", sala: salaResult.rows[0] });
            } else {
                cb?.({ status: "error" });
            }
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- SALIR DE SALA ----
    socket.on("Salir Sala", async ({ salaId }, cb) => {
        if (!user) return;
        
        try {
            await db.execute({
                sql: "DELETE FROM MiembrosSala WHERE salaId = ? AND usuario = ?",
                args: [salaId, user.nombre]
            });
            
            socket.leave(salaId);
            user.sala = null;
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- INVITAR A SALA ----
    socket.on("Invitar a Sala", async ({ salaId, usuario }, cb) => {
        if (!user) return;
        
        try {
            await db.execute({
                sql: "INSERT OR IGNORE INTO MiembrosSala (salaId, usuario, rol, esAdmin, joinedAt) VALUES (?, ?, ?, ?, ?)",
                args: [salaId, usuario, "miembro", 0, Date.now()]
            });
            
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- OBTENER INFO USUARIO ----
    socket.on("Obtener Info Usuario", async ({ targetUser }, cb) => {
        try {
            const result = await db.execute({
                sql: "SELECT nombre, avatar, creado FROM Usuarios WHERE nombre = ?",
                args: [targetUser]
            });
            
            if (result.rows.length > 0) {
                cb?.({ status: "ok", info: result.rows[0] });
            } else {
                cb?.({ status: "error" });
            }
        } catch {
            cb?.({ status: "error" });
        }
    });
}

export default { setupRooms };