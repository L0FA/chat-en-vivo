import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";

export function useMessages(socket, currentRoom = null) {
    const {
        addMessage, updateMessage, removeMessage,
        updateReaction, setTypingUsers, clearMessages
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
        
        console.log("🧹 Cambiando a sala:", currentRoom, "- Limpiando chat");
        clearMessages();
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

        const handleNewMessage = (data) => {
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
        };

        const handleHistorial = (meta = {}) => {
            setHasMore(!!meta.hasMore);
            setHistorialListo(true);
        };

        const handleEdit = ({ messageId, newContent }) => {
            updateMessage(messageId, { content: newContent, edited: true });
        };

        const handleDelete = ({ messageId }) => {
            removeMessage(messageId);
        };

        const handleReaction = ({ messageId, emoji, user, action }) => {
            updateReaction(messageId, emoji, user, action);
        };

        const handleTyping = ({ user, typing, room }) => {
            if (room !== currentRoomRef.current) return;
            
            if (typing) {
                const typingSound = localStorage.getItem("typing-sound") || "default";
                const lastTypingSoundTime = parseInt(localStorage.getItem("last-typing-sound") || "0");
                const now = Date.now();
                
                if (typingSound !== "none" && now - lastTypingSoundTime > 3000) {
                    localStorage.setItem("last-typing-sound", now.toString());
                    try {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        if (audioCtx.state === "suspended") audioCtx.resume();
                        const oscillator = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        
                        oscillator.frequency.value = 400;
                        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
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
        };

        socket.on("Mensaje en Chat", handleNewMessage);
        socket.on("historial cargado", handleHistorial);
        socket.on("Mensaje Editado", handleEdit);
        socket.on("Mensaje Eliminado", handleDelete);
        socket.on("Reacción Actualizada", handleReaction);
        socket.on("Usuario Escribiendo", handleTyping);

        return () => {
            socket.off("Mensaje en Chat", handleNewMessage);
            socket.off("historial cargado", handleHistorial);
            socket.off("Mensaje Editado", handleEdit);
            socket.off("Mensaje Eliminado", handleDelete);
            socket.off("Reacción Actualizada", handleReaction);
            socket.off("Usuario Escribiendo", handleTyping);
        };
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