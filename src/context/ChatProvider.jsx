import { useState, useCallback } from "react";
import { ChatContext } from "./ChatContext";

export function ChatProvider({ children }) {
    const [user, setUser] = useState(() => localStorage.getItem("NombreUsuario") || "");
    const [messages, setMessages] = useState([]);
    const [theme, setTheme] = useState(() => localStorage.getItem("chat-theme") || "default");
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);

    const addMessage = useCallback((msg) => {
        setMessages(prev => {
            const exists = prev.find(m => m.id === msg.id);
            if (exists) {
                if (exists.pending) {
                    return prev.map(m => m.id === msg.id ? { ...msg, pending: false } : m);
                }
                return prev;
            }
            return [...prev, msg];
        });
    }, []);

    const prependMessages = useCallback((msgs) => {
        setMessages(prev => [...msgs, ...prev]);
    }, []);

    const updateMessage = useCallback((id, updates) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }, []);

    const removeMessage = useCallback((id) => {
        setMessages(prev => prev.map(m =>
            m.id === id ? { ...m, deleted: true, content: "" } : m
        ));
    }, []);

    const updateReaction = useCallback((messageId, emoji, reactUser, action) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id !== messageId) return msg;
            const reactions = { ...(msg.reactions || {}) };
            if (!reactions[emoji]) reactions[emoji] = [];
            if (action === "remove") {
                reactions[emoji] = reactions[emoji].filter(u => u !== reactUser);
            } else {
                if (!reactions[emoji].includes(reactUser)) {
                    reactions[emoji] = [...reactions[emoji], reactUser];
                }
            }
            return { ...msg, reactions };
        }));
    }, []);

    const changeTheme = useCallback((name) => {
        setTheme(name);
        localStorage.setItem("chat-theme", name);
    }, []);

    const login = useCallback((nombre) => {
        localStorage.setItem("NombreUsuario", nombre);
        setUser(nombre);
    }, []);

    return (
        <ChatContext.Provider value={{
            user, login,
            messages, addMessage, prependMessages, updateMessage, removeMessage, updateReaction,
            theme, changeTheme,
            connectedUsers, setConnectedUsers,
            replyingTo, setReplyingTo,
            lightboxSrc, setLightboxSrc,
            typingUsers, setTypingUsers
        }}>
            {children}
        </ChatContext.Provider>
    );
}