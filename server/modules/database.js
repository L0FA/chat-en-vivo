// ============================================
// 💾 DATABASE MODULE - Inicialización de tablas
// Archivo: server/modules/database.js
// ============================================

import { createClient } from "@libsql/client/web";
import process from "node:process";

let _db;

export function getDb() {
    if (!_db) {
        _db = createClient({
            url: process.env.DB_URL,
            authToken: process.env.DB_TOKEN,
        });
    }
    return _db;
}

// Proxy que permite usar `db.execute(...)` pero inicializa lazy
export const db = new Proxy({}, {
    get(_, prop) {
        const client = getDb();
        const value = client[prop];
        // IMPORTANTE: Enlazar funciones al cliente original para no perder el contexto 'this'
        if (typeof value === "function") return value.bind(client);
        return value;
    }
});

const ADMIN_LIST = (process.env.ADMINS || "Testing,La Compu Del Admin,Anonimo,Wachin,usuariorosa").split(",").map(a => a.trim());
const APP_START_DATE = new Date("2026-04-01").getTime();

export async function initDatabase() {
    const db = getDb();

    // Tabla Usuarios
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Usuarios (
            nombre TEXT PRIMARY KEY,
            avatar TEXT,
            creado INTEGER NOT NULL
        )
    `);

    // Agregar admins por defecto
    for (const admin of ADMIN_LIST) {
        await db.execute({
            sql: "INSERT OR IGNORE INTO Usuarios (nombre, avatar, creado) VALUES (?, ?, ?)",
            args: [admin, null, APP_START_DATE]
        });
    }

    // Tabla Mensajes
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Mensajes (
            id TEXT PRIMARY KEY,
            content TEXT,
            user TEXT,
            timestamp INTEGER,
            type TEXT,
            replyToId TEXT,
            replyToUser TEXT,
            replyToContent TEXT,
            edited INTEGER DEFAULT 0,
            destructSeconds INTEGER DEFAULT 0,
            room TEXT
        )
    `);

    // Tabla Reacciones
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Reacciones (
            id TEXT PRIMARY KEY,
            messageId TEXT,
            emoji TEXT,
            user TEXT,
            timestamp INTEGER
        )
    `);

    // Tabla Canciones
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Canciones (
            id TEXT PRIMARY KEY,
            titulo TEXT NOT NULL,
            artista TEXT,
            tipo TEXT NOT NULL,
            contenido TEXT NOT NULL,
            portada TEXT,
            usuario TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )
    `);

    // Tabla Salas (Alineada con Drizzle Studio)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS Salas (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            dueno TEXT,
            creado INTEGER NOT NULL,
            esPrivada INTEGER DEFAULT 0
        )
    `);

    // Tabla Miembros Sala (Alineada con Drizzle Studio)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS MiembrosSala (
            salaId TEXT,
            usuario TEXT,
            rol TEXT DEFAULT "miembro",
            esAdmin INTEGER DEFAULT 0,
            joinedAt INTEGER,
            PRIMARY KEY (salaId, usuario)
        )
    `);

    console.log("✅ Base de datos inicializada");
}

export default db;