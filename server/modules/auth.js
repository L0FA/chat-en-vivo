// ============================================
// 🔐 AUTH MODULE - Login, logout, avatar
// Archivo: server/modules/auth.js
// ============================================

import { db } from "./database.js";

export function setupAuth(io, socket, connectedUsers) {
    // ---- LOGIN ----
    socket.on("Login", async ({ nombre, avatar }, cb) => {
        if (!nombre?.trim()) {
            cb?.({ status: "error", message: "Nombre requerido" });
            return;
        }

        const isNewUser = !(await db.execute({
            sql: "SELECT 1 FROM Usuarios WHERE nombre = ?",
            args: [nombre]
        })).rows.length;

        if (isNewUser) {
            await db.execute({
                sql: "INSERT INTO Usuarios (nombre, avatar, creado) VALUES (?, ?, ?)",
                args: [nombre.trim(), avatar || null, Date.now()]
            });
        }

        const user = nombre.trim();
        connectedUsers.set(socket.id, { nombre: user, avatar: avatar || null, sala: "general" });
        
        socket.join("general");
        socket.emit("Login Exitoso", { 
            user, 
            avatar: avatar || null,
            isAdmin: ["Testing", "La Compu Del Admin", "Anonimo", "Wachin", "usuariorosa"].includes(user)
        });
        
        const users = [...connectedUsers.values()];
        const admins = users.filter(u => ["Testing", "La Compu Del Admin", "Anonimo", "Wachin", "usuariorosa"].includes(u.nombre)).map(u => u.nombre);
        socket.emit("Users Actualizados", { users, admins });
        socket.broadcast.emit("Users Actualizados", { users, admins });

        cb?.({ status: "ok", user, avatar: avatar || null });
    });

    // ---- DISCONNECT ----
    socket.on("disconnect", async () => {
        connectedUsers.delete(socket.id);
        
        const users = [...connectedUsers.values()];
        const admins = users.filter(u => ["Testing", "La Compu Del Admin", "Anonimo", "Wachin", "usuariorosa"].includes(u.nombre)).map(u => u.nombre);
        io.emit("Users Actualizados", { users, admins });
    });

    // ---- ACTUALIZAR AVATAR ----
    socket.on("Actualizar Avatar", async ({ avatar }, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) {
            cb?.({ status: "error" });
            return;
        }

        user.avatar = avatar;

        cb?.({ status: "ok", avatar });
    });
}

export default { setupAuth };