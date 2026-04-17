// ============================================
// 🔐 AUTH MODULE - Login, logout, avatar
// Archivo: server/modules/auth.js
// ============================================

import { db } from "./database.js";

const ADMIN_USERS = ["Testing", "La Compu Del Admin", "El Celu Del Admin", "Anonimo", "Wachin", "usuariorosa"];

export async function setupAuth(io, socket, connectedUsers) {
    const auth = socket.handshake.auth;
    const nombre = auth?.NombreUsuario || auth?.nombre || auth?.name;
    const avatar = auth?.avatar;
    
    if (nombre?.trim()) {
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
        connectedUsers.set(socket.id, { nombre: user, avatar: finalAvatar, sala: null });
        
        
        socket.emit("Login Exitoso", { 
            user, 
            avatar: finalAvatar,
            isAdmin: ADMIN_USERS.includes(user)
        });
        
        // Obtener todos los usuarios de DB para avatares (batch query)
        const nombres = [...connectedUsers.values()].map(u => u.nombre);
        let results = { rows: [] };
        if (nombres.length > 0) {
            const placeholders = nombres.map(() => "?").join(",");
            results = await db.execute({
                sql: `SELECT nombre, avatar FROM Usuarios WHERE nombre IN (${placeholders})`,
                args: nombres
            });
        }
        
        const avatarMap = {};
        for (const row of results.rows) {
            avatarMap[row.nombre] = row.avatar;
        }
        
        const users = [...connectedUsers.values()].map(u => ({
            ...u,
            avatar: avatarMap[u.nombre] || u.avatar
        }));
        
        const admins = ADMIN_USERS;
        socket.emit("Users Actualizados", { users, admins });
        io.emit("Users Actualizados", { users, admins });
    }

    // ---- LOGIN EVENT (explicit) ----
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
        connectedUsers.set(socket.id, { nombre: user, avatar: finalAvatar, sala: null });
        
        
        socket.emit("Login Exitoso", { 
            user, 
            avatar: finalAvatar,
            isAdmin: ADMIN_USERS.includes(user)
        });
        
        const users = await Promise.all([...connectedUsers.values()].map(async u => {
            const result = await db.execute({
                sql: "SELECT avatar FROM Usuarios WHERE nombre = ?",
                args: [u.nombre]
            });
            return { ...u, avatar: result.rows[0]?.avatar || u.avatar };
        }));
        
        const admins = ADMIN_USERS;
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
        const admins = ADMIN_USERS;
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