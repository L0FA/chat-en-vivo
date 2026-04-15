import { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function useSocket(nombreUsuario, password = "") {
    const socket = useMemo(() => {
        if (!nombreUsuario) return null;
        return io(SOCKET_URL, {
            auth: { NombreUsuario: nombreUsuario, password },
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 500,
            reconnectionDelayMax: 2000,
            timeout: 20000,
            forceNew: false,
            withCredentials: true
        });
    }, [nombreUsuario, password]);

    const [connected, setConnected] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

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
        socket.on("Error", (data) => {
            console.error("Socket error:", data.message);
            alert(data.message);
        });
        socket.on("Admin Password Required", (data) => {
            alert(data.message);
        });
        socket.on("Logged In", (data) => {
            setIsAdmin(data.isAdmin || false);
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("Error");
            socket.off("Admin Password Required");
            socket.off("Logged In");
            socket.disconnect();
            setConnected(false);
        };
    }, [socket]);

    return { socket, connected, isAdmin };
}
