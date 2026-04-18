import { useState, useCallback, useEffect } from "react";
import { ChatContext } from "./ChatContext";

export function ChatProvider({ children }) {
    const [user, setUser] = useState(() => localStorage.getItem("NombreUsuario") || "");
    const [password, setPassword] = useState(() => localStorage.getItem("UserPassword") || "");
    const [avatar, setAvatar] = useState(() => localStorage.getItem("UserAvatar") || "😀");
    const [messages, setMessages] = useState([]);
    const [theme, setTheme] = useState(() => localStorage.getItem("chat-theme") || "default");
    const [connectedUsers, setConnectedUsers] = useState(() => {
        const saved = localStorage.getItem("connected-users");
        return saved ? JSON.parse(saved) : [];
    });
    const [adminsList, setAdminsList] = useState(() => {
        const saved = localStorage.getItem("admins-list");
        return saved ? JSON.parse(saved) : [];
    });
    const [replyingTo, setReplyingTo] = useState(null);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const [userRooms, setUserRooms] = useState(() => {
        const saved = localStorage.getItem("user-rooms");
        return saved ? JSON.parse(saved) : [];
    });
    // Siempre iniciar sin sala seleccionada para mostrar el placeholder
    const [currentRoom, setCurrentRoom] = useState(null);

    const handleSetConnectedUsers = useCallback((users) => {
        setConnectedUsers(users);
        localStorage.setItem("connected-users", JSON.stringify(users));
    }, []);

    const handleSetAdminsList = useCallback((admins) => {
        setAdminsList(admins);
        localStorage.setItem("admins-list", JSON.stringify(admins));
    }, []);

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

    const setBatchMessages = useCallback((newMessages) => {
        setMessages(newMessages.sort((a,b) => a.timestamp - b.timestamp));
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
        const targetRoom = roomId || "sala-global";
        setCurrentRoom(targetRoom);
        localStorage.setItem("currentRoom", targetRoom);
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
        const savedAvatar = localStorage.getItem("UserAvatar") || "😀";
        console.log("🔐 Login - cargando avatar desde localStorage:", savedAvatar.startsWith("data:image") ? "SÍ (imagen)" : "NO (emoji)");
        setUser(nombre);
        setPassword(password);
        setAvatar(savedAvatar);
        // NO cargar sala automáticamente - esperar a que el usuario elija
        setCurrentRoom(null);
        localStorage.setItem("currentRoom", "");
    }, []);

    const updateProfile = useCallback((nombre, nuevoAvatar) => {
        if (nombre) {
            localStorage.setItem("NombreUsuario", nombre);
            setUser(nombre);
        }
        if (nuevoAvatar !== undefined) {
            if (nuevoAvatar === "" || nuevoAvatar.startsWith("data:image")) {
                setAvatar(nuevoAvatar);
                localStorage.setItem("UserAvatar", nuevoAvatar);
            }
        }
    }, []);

    const clearMessages = useCallback(() => setMessages([]), []);

    return (
        <ChatContext.Provider value={{
            user, password, login, avatar, updateProfile,
            messages, setMessages, setBatchMessages, clearMessages, addMessage, prependMessages, updateMessage, removeMessage, updateReaction,
            theme, changeTheme,
            connectedUsers, setConnectedUsers: handleSetConnectedUsers,
            adminsList, setAdminsList: handleSetAdminsList,
            replyingTo, setReplyingTo,
            lightboxSrc, setLightboxSrc,
            typingUsers, setTypingUsers,
            currentRoom, changeRoom, userRooms, addUserRoom, removeUserRoom
        }}>
            {children}
        </ChatContext.Provider>
    );
}