// ============================================
// 🚪 ROOMS MODULE - Sala creation, joining, invitations
// Archivo: server/modules/rooms.js
// ============================================

import { db } from "./database.js";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function setupRooms(socket, connectedUsers) {
    // ---- OBTENER MIS SALAS ----
    socket.on("Obtener Mis Salas", async (cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) {
            console.log("⚠️ [ROOMS] Intento de Obtener Mis Salas sin user en map para:", socket.id);
            return cb?.({ status: "error", message: "No autenticado" });
        }
        
        const ADMIN_LIST = (process.env.ADMINS || "").split(",").map(a => a.trim().toLowerCase()).filter(Boolean);
        const isAdmin = ADMIN_LIST.includes(user.nombre.toLowerCase());

        try {
            const result = await db.execute({
                sql: `SELECT s.*, sm.esAdmin FROM Salas s 
                      JOIN MiembrosSala sm ON s.id = sm.salaId 
                      WHERE sm.usuario = ?`,
                args: [user.nombre]
            });
            
            let salas = result.rows;

            // Inyectar sala de admins si es admin y no está en la lista
            if (isAdmin && !salas.find(s => s.id === "sala-admins-global")) {
                salas.push({
                    id: "sala-admins-global",
                    nombre: "💻 Registro Global (Admin)",
                    descripcion: "Historial de todos los mensajes del sistema",
                    dueno: "System",
                    esAdmin: 1
                });
            }

            cb?.({ status: "ok", salas });
        } catch (err) {
            console.error("❌ ERROR AL OBTENER SALAS:", err);
            cb?.({ status: "error" });
        }
    });

    // ---- CREAR SALA ----
    socket.on("Crear Sala", async ({ nombre, descripcion }, cb) => {
        const user = connectedUsers.get(socket.id);
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
        const user = connectedUsers.get(socket.id);
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
        const user = connectedUsers.get(socket.id);
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
        const user = connectedUsers.get(socket.id);
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