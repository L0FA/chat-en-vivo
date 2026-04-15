// ============================================
// 🎵 MUSIC MODULE - Songs sync and management
// Archivo: server/modules/music.js
// ============================================

import { db } from "./database.js";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function setupMusic(io, socket, connectedUsers) {
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
        } catch (e) {
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
        } catch (e) {
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