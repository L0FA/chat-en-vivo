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

        const user = nombre.trim();
        const existingUser = await db.execute({
            sql: "SELECT avatar FROM Usuarios WHERE nombre = ?",
            args: [user]
        });
        
        let storedAvatar = null;
        if (existingUser.rows.length > 0) {
            storedAvatar = existingUser.rows[0].avatar;
        } else {
            await db.execute({
                sql: "INSERT INTO Usuarios (nombre, avatar, creado) VALUES (?, ?, ?)",
                args: [user, avatar || null, Date.now()]
            });
        }

        const finalAvatar = storedAvatar || avatar || null;
        connectedUsers.set(socket.id, { nombre: user, avatar: finalAvatar, sala: "general" });
        
        socket.join("general");
        socket.emit("Login Exitoso", { 
            user, 
            avatar: finalAvatar,
            isAdmin: ["Testing", "La Compu Del Admin", "Anonimo", "Wachin", "usuariorosa"].includes(user)
        });
        
        const users = await Promise.all([...connectedUsers.values()].map(async u => {
            const result = await db.execute({
                sql: "SELECT avatar FROM Usuarios WHERE nombre = ?",
                args: [u.nombre]
            });
            return { ...u, avatar: result.rows[0]?.avatar || u.avatar };
        }));
        const admins = users.filter(u => ["Testing", "La Compu Del Admin", "Anonimo", "Wachin", "usuariorosa"].includes(u.nombre)).map(u => u.nombre);
        socket.emit("Users Actualizados", { users, admins });
        socket.broadcast.emit("Users Actualizados", { users, admins });

        cb?.({ status: "ok", user, avatar: avatar || null });
    });

    // ---- DISCONNECT ----
    socket.on("disconnect", async () => {
        connectedUsers.delete(socket.id);
        
        const users = await Promise.all([...connectedUsers.values()].map(async u => {
            const result = await db.execute({
                sql: "SELECT avatar FROM Usuarios WHERE nombre = ?",
                args: [u.nombre]
            });
            return { ...u, avatar: result.rows[0]?.avatar || u.avatar };
        }));
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
        
        await db.execute({
            sql: "UPDATE Usuarios SET avatar = ? WHERE nombre = ?",
            args: [avatar, user.nombre]
        });

        cb?.({ status: "ok", avatar });
    });
}

export default { setupAuth };