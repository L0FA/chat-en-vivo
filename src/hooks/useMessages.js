import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";

export function useMessages(socket) {
    const {
        addMessage, updateMessage, removeMessage,
        updateReaction, setConnectedUsers, setTypingUsers
    } = useChat();

    const [historialListo, setHistorialListo] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const oldestTimestamp = useRef(null);

    useEffect(() => {
    if (!socket) return;

socket.on("Mensaje en Chat", (data) => {
    const normalized = {
        ...data,
        deleted: Number(data.deleted) === 1,
        edited: Number(data.edited) === 1,
        pending: Number(data.pending) === 1
    };
    if (normalized.timestamp && (!oldestTimestamp.current || normalized.timestamp < oldestTimestamp.current)) {
        oldestTimestamp.current = normalized.timestamp;
    }
    addMessage(normalized);
});

    socket.on("historial cargado", (meta = {}) => {
        setHasMore(!!meta.hasMore);
        setHistorialListo(true);
    });

    socket.on("Mensaje Editado", ({ messageId, newContent }) => {
        updateMessage(messageId, { content: newContent, edited: true });
    });

    socket.on("Mensaje Eliminado", ({ messageId }) => {
        removeMessage(messageId);
    });

    socket.on("Reacción Actualizada", ({ messageId, emoji, user, action }) => {
        updateReaction(messageId, emoji, user, action);
    });

    socket.on("Usuarios Conectados", ({ users }) => {
        setConnectedUsers(users);
    });

    socket.on("Usuario Escribiendo", ({ user, typing }) => {
        setTypingUsers(prev =>
            typing
                ? prev.includes(user) ? prev : [...prev, user]
                : prev.filter(u => u !== user)
        );
    });

    socket.on("Reacciones Iniciales", (reacciones) => {
        reacciones.forEach(({ messageId, emoji, user, action }) => {
            updateReaction(messageId, emoji, user, action);
        });
    });

    return () => {
        socket.off("Mensaje en Chat");
        socket.off("historial cargado");
        socket.off("Mensaje Editado");
        socket.off("Mensaje Eliminado");
        socket.off("Reacción Actualizada");
        socket.off("Usuarios Conectados");
        socket.off("Usuario Escribiendo");
        socket.off("Reacciones Iniciales");
    };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [socket]);

    const loadOlder = (callback) => {
        if (!socket || !oldestTimestamp.current) return;
        socket.emit("Cargar mensajes anteriores", { beforeTimestamp: oldestTimestamp.current }, (response) => {
            if (!response || response.status !== "ok") return;
            const msgs = response.messages || [];
            if (msgs.length > 0) {
                oldestTimestamp.current = msgs[0].timestamp;
            }
            setHasMore(!!response.hasMore);
            callback(msgs);
        });
    };

    return { historialListo, hasMore, loadOlder };
}