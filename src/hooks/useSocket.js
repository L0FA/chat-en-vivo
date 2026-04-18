import { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function useSocket(nombreUsuario, password = "") {
    const socket = useMemo(() => {
        if (!nombreUsuario) return null;
        console.log("🔌 [SOCKET] Conectando a:", SOCKET_URL, "con usuario:", nombreUsuario);
        return io(SOCKET_URL, {
            auth: { NombreUsuario: nombreUsuario, password },
            transports: ["polling", "websocket"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 500,
            reconnectionDelayMax: 2000,
            timeout: 20000,
            forceNew: false
        });
    }, [nombreUsuario, password]);

    const [connected, setConnected] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loginData, setLoginData] = useState(null);

    useEffect(() => {
        if (!socket) return;

        socket.on("connect", () => {
            console.log("🔌 [SOCKET] Conectado!", socket.id);
            setConnected(true);
        });
        socket.on("disconnect", () => {
            console.log("🔌 [SOCKET] Desconectado!");
            setConnected(false);
        });
        socket.on("connect_error", (err) => {
            console.error("🔌 [SOCKET] Error de conexión:", err.message);
        });
        socket.on("Error", (data) => {
            console.error("Socket error:", data.message);
            alert(data.message);
        });
        socket.on("Admin Password Required", (data) => {
            console.log("🔐 [SOCKET] Admin Password Required:", data);
            alert(data.message);
        });
        socket.on("Login Exitoso", (data) => {
            console.log("🔌 [SOCKET] Login Exitoso - data recibida:", data);
            setLoginData(data);
            setIsAdmin(data.isAdmin || false);
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("connect_error");
            socket.off("Error");
            socket.off("Admin Password Required");
            socket.off("Login Exitoso");
            socket.disconnect();
            setConnected(false);
        };
    }, [socket]);

    return { socket, connected, isAdmin, loginData };
}