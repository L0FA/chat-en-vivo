import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function useSocket(nombreUsuario) {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!nombreUsuario) return;

        const newSocket = io(SOCKET_URL, {
            auth: { NombreUsuario: nombreUsuario },
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

        return () => {
            newSocket.off("connect");
            newSocket.off("disconnect");
            newSocket.disconnect();
            setSocket(null);
            setConnected(false);
        };
    }, [nombreUsuario]);

    return { socket, connected };
}