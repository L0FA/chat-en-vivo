import { useEffect, useRef } from "react";

export function useTyping(socket) {
    const isTyping = useRef(false);
    const timeout = useRef(null);

    function onType() {
        if (!socket) return;
        if (!isTyping.current) {
            socket.emit("Escribiendo", { typing: true });
            isTyping.current = true;
        }
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
            socket.emit("Escribiendo", { typing: false });
            isTyping.current = false;
        }, 2000);
    }

    function stopTyping() {
        if (!socket) return;
        clearTimeout(timeout.current);
        if (isTyping.current) {
            socket.emit("Escribiendo", { typing: false });
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