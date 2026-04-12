import { useState, useCallback } from "react";
import { ChatContext } from "./ChatContext";

export function ChatProvider({ children }) {
    const [user, setUser] = useState(() => localStorage.getItem("NombreUsuario") || "");
    const [password, setPassword] = useState(() => localStorage.getItem("UserPassword") || "");
    const [avatar, setAvatar] = useState(() => localStorage.getItem("UserAvatar") || "");
    const [messages, setMessages] = useState([]);
    const [theme, setTheme] = useState(() => localStorage.getItem("chat-theme") || "default");
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const [userRooms, setUserRooms] = useState(() => {
        const saved = localStorage.getItem("user-rooms");
        return saved ? JSON.parse(saved) : [];
    });
    const [currentRoom, setCurrentRoom] = useState(() => localStorage.getItem("currentRoom") || null);

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

    const changeRoom = useCallback((roomId) => {
        setCurrentRoom(roomId);
        localStorage.setItem("currentRoom", roomId);
        setMessages([]);
    }, []);

    const addUserRoom = useCallback((room) => {
        setUserRooms(prev => {
            const exists = prev.find(r => r.id === room.id);
            if (exists) return prev;
            const newRooms = [...prev, room];
            localStorage.setItem("user-rooms", JSON.stringify(newRooms));
            return newRooms;
        });
    }, []);

    const removeUserRoom = useCallback((roomId) => {
        setUserRooms(prev => {
            const newRooms = prev.filter(r => r.id !== roomId);
            localStorage.setItem("user-rooms", JSON.stringify(newRooms));
            return newRooms;
        });
        if (currentRoom === roomId) {
            setCurrentRoom(null);
            localStorage.removeItem("currentRoom");
        }
    }, [currentRoom]);

    const login = useCallback((nombre, password = "") => {
        localStorage.setItem("NombreUsuario", nombre);
        localStorage.setItem("UserPassword", password);
        setUser(nombre);
        setPassword(password);
        if (nuevoAvatar !== null) {
            setAvatar(nuevoAvatar);
            localStorage.setItem("UserAvatar", nuevoAvatar);
        }
    }, []);

    const updateProfile = useCallback((nombre, nuevoAvatar) => {
        if (nombre) {
            localStorage.setItem("NombreUsuario", nombre);
            setUser(nombre);
        }
        if (nuevoAvatar !== undefined) {
            setAvatar(nuevoAvatar);
            localStorage.setItem("UserAvatar", nuevoAvatar);
        }
    }, []);

    return (
        <ChatContext.Provider value={{
            user, password, login, avatar, updateProfile,
            messages, addMessage, prependMessages, updateMessage, removeMessage, updateReaction,
            theme, changeTheme,
            connectedUsers, setConnectedUsers,
            replyingTo, setReplyingTo,
            lightboxSrc, setLightboxSrc,
            typingUsers, setTypingUsers,
            currentRoom, changeRoom, userRooms, addUserRoom, removeUserRoom
        }}>
            {children}
        </ChatContext.Provider>
    );
}