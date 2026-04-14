import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";

export function useMessages(socket, currentRoom = null) {
    const {
        addMessage, updateMessage, removeMessage,
        updateReaction, setTypingUsers
    } = useChat();

    const [historialListo, setHistorialListo] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const oldestTimestamp = useRef(null);
    const currentRoomRef = useRef(currentRoom);

    useEffect(() => {
        currentRoomRef.current = currentRoom;
    }, [currentRoom]);

    // Efecto para cargar mensajes cuando cambia la sala
    useEffect(() => {
        if (!socket || !currentRoom) return;
        
        oldestTimestamp.current = null;
        setHistorialListo(false);
        setHasMore(false);

        socket.emit("Cargar Mensajes Sala", { room: currentRoom }, (res) => {
            if (res?.status === "ok") {
                console.log(`📥 Cargados ${res.count} mensajes para sala ${currentRoom}`);
            }
        });
    }, [socket, currentRoom]);

    useEffect(() => {
        if (!socket) return;

        oldestTimestamp.current = null;
        setHistorialListo(false);
        setHasMore(false);

    socket.on("Mensaje en Chat", (data) => {
    // Solo mostrar mensajes de la sala actual
    if (data.room && data.room !== currentRoomRef.current) return;
    
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

    socket.on("Estado Leído", ({ messageId, viewers }) => {
        updateMessage(messageId, { read: true, viewers: viewers || [] });
    });

    socket.on("Usuario Escribiendo", ({ user, typing, room }) => {
        if (room !== currentRoomRef.current) return;
        
        if (typing) {
            const typingSound = localStorage.getItem("typing-sound") || "default";
            const lastTypingSoundTime = parseInt(localStorage.getItem("last-typing-sound") || "0");
            const now = Date.now();
            
            if (typingSound !== "none" && now - lastTypingSoundTime > 3000) {
                localStorage.setItem("last-typing-sound", now.toString());
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    if (audioCtx.state === "suspended") {
                        audioCtx.resume();
                    }
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    if (typingSound === "soft") {
                        oscillator.frequency.value = 300;
                        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                    } else if (typingSound === "click") {
                        oscillator.frequency.value = 500;
                        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                    } else {
                        oscillator.frequency.value = 400;
                        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
                    }
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.1);
                } catch { /* silence is golden */ }
            }
        }
        setTypingUsers(prev =>
            typing
                ? prev.includes(user) ? prev : [...prev, user]
                : prev.filter(u => u !== user)
        );
    });

    return () => {
        socket.off("Mensaje en Chat");
        socket.off("historial cargado");
        socket.off("Mensaje Editado");
        socket.off("Mensaje Eliminado");
        socket.off("Reacción Actualizada");
        socket.off("Estado Leído");
        socket.off("Usuario Escribiendo");
    };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [socket, currentRoom]);

    const loadOlder = (callback) => {
        if (!socket || !oldestTimestamp.current || !currentRoom) return;
        socket.emit("Cargar mensajes anteriores", { beforeTimestamp: oldestTimestamp.current, room: currentRoom }, (response) => {
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