import { useEffect, useRef } from "react";

export function useTyping(socket) {
    const isTyping = useRef(false);
    const timeout = useRef(null);

    function onType(room) {
        if (!socket) return;
        if (!isTyping.current) {
            socket.emit("Escribiendo", { typing: true, room });
            isTyping.current = true;
        }
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
            socket.emit("Escribiendo", { typing: false, room });
            isTyping.current = false;
        }, 2000);
    }

    function stopTyping(room) {
        if (!socket) return;
        clearTimeout(timeout.current);
        if (isTyping.current) {
            socket.emit("Escribiendo", { typing: false, room });
            isTyping.current = false;
        }
    }

    useEffect(() => {
        return () => {
            clearTimeout(timeout.current);
        };
    }, []);

    return { onType, stopTyping };
}