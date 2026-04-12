import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function useSocket(nombreUsuario, password = "") {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!nombreUsuario) return;

        const newSocket = io(SOCKET_URL, {
            auth: { NombreUsuario: nombreUsuario, password },
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 500,
            reconnectionDelayMax: 2000,
            timeout: 20000,
            forceNew: true,
            withCredentials: true
        });

        setSocket(newSocket);

        newSocket.on("connect", () => setConnected(true));
        newSocket.on("disconnect", () => setConnected(false));
        newSocket.on("Error", (data) => {
            console.error("Socket error:", data.message);
            alert(data.message);
        });
        newSocket.on("Admin Password Required", (data) => {
            alert(data.message);
        });

        return () => {
            newSocket.off("connect");
            newSocket.off("disconnect");
            newSocket.off("Error");
            newSocket.off("Admin Password Required");
            newSocket.disconnect();
            setSocket(null);
            setConnected(false);
        };
    }, [nombreUsuario, password]);

    return { socket, connected };
}