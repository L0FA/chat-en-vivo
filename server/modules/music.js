// ============================================
// 🎵 MUSIC MODULE - Songs sync and management
// Archivo: server/modules/music.js
// ============================================

import { db } from "./database.js";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export async function setupMusic(io, socket, connectedUsers) {
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

    // Inicialización: Enviar lista actual al conectar
    try {
        const result = await db.execute("SELECT * FROM Canciones ORDER BY timestamp ASC");
        socket.emit("Lista Música Actualizada", result.rows);
    } catch (e) {
        console.error("❌ Error enviando lista inicial:", e);
    }

    // ---- OBTENER COLA COMPLETA ----
    socket.on("Cargar Cola Música", async (cb) => {
        try {
            const result = await db.execute("SELECT * FROM Canciones ORDER BY timestamp ASC");
            cb?.({ status: "ok", canciones: result.rows });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- SUBIR CANCIÓN ----
    socket.on("Subir Canción", async (payload, cb) => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;

        const { titulo, artista, tipo, contenido, portada } = payload;
        const id = generateId();
        const timestamp = Date.now();

        try {
            await db.execute({
                sql: "INSERT INTO Canciones (id, titulo, artista, tipo, contenido, portada, usuario, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                args: [id, titulo, artista || "Desconocido", tipo, contenido, portada || null, user.nombre, timestamp]
            });

            const cancion = { id, titulo, artista, tipo, contenido, portada, usuario: user.nombre, timestamp };
            io.emit("Canción Agregada", cancion);
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- ELIMINAR CANCIÓN ----
    socket.on("Eliminar Canción", async ({ cancionId }, cb) => {
        try {
            await db.execute({
                sql: "DELETE FROM Canciones WHERE id = ?",
                args: [cancionId]
            });

            io.emit("Canción Eliminada", { cancionId });
            cb?.({ status: "ok" });
        } catch {
            cb?.({ status: "error" });
        }
    });

    // ---- SYNC MÚSICA APP ----
    socket.on("Sync Música App", (payload) => {
        socket.broadcast.emit("Sync Música App", payload);
    });

    // ---- MÚSICA COMPARTIDA ----
    socket.on("Música Compartida", (payload) => {
        socket.broadcast.emit("Música Compartida", payload);
    });

    // ---- SINCRONIZAR MÚSICA ----
    socket.on("Sincronizar Música", (payload) => {
        socket.broadcast.emit("Sincronizar Música", payload);
    });
}

export default { setupMusic };