import { useState, useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { MusicCard } from "./MusicPanel";


const QUICK_EMOJIS = ["❤️", "😂", "🥰", "😍", "🔥", "👍", "👎", "😢", "😮", "😡", "🎉", "💯", "🙏", "😭", "😊", "🤔", "🥺", "💀", "👀", "🤷"];

function getUserColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 65%, 55%)`;
}

function highlightMentions(text, currentUser) {
    if (!text) return "";
    return text.replace(/@(\w+)/g, (match, u) => {
        const isMe = u === currentUser;
        return `<span class="${isMe ? "text-pink-500 font-bold bg-pink-100 rounded px-0.5" : "text-blue-500 font-bold"}">${match}</span>`;
    });
}

export default function Message({ message, currentUser, socket, onImageClick, onPlayMusic, userAvatar, adminsList = [] }) {
    const { setReplyingTo, theme, connectedUsers } = useChat();
    const [showPicker, setShowPicker] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(message.content);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
    const [userInfoModal, setUserInfoModal] = useState(null);
    
    const longPressTimerRef = useRef(null);

    const isOwn = message.user === currentUser;
    const displayAvatar = isOwn && userAvatar ? userAvatar : "😀";
    
    const getThemeStyles = () => {
    switch (theme) {

        case "rosa":
    return isOwn
        ? "bg-pink-300/70 text-pink-900 backdrop-blur shadow-[0_0_10px_rgba(255,182,193,0.6)] animate-petalFloat"
        : "bg-pink-100/70 text-pink-800 backdrop-blur";

        case "neon":
            return isOwn
                ? "bg-black text-green-400 border border-green-400 shadow-[0_0_10px_#00ff88] animate-neonPulse"
                : "bg-black text-green-300 border border-green-400/50";

    case "cyberpunk":
        return isOwn
            ? "bg-black text-pink-400 border border-pink-500 shadow-[0_0_10px_#ff0080] glitch"
            : "bg-black text-pink-300 border border-pink-500/50 glitch-soft";


        case "ocean":
            return isOwn
                ? "bg-blue-900/40 text-blue-100 backdrop-blur animate-float"
                : "bg-blue-800/30 text-blue-100 backdrop-blur";

        case "galaxy":
            return isOwn
                ? "bg-purple-900/40 text-purple-100 backdrop-blur shadow-[0_0_15px_rgba(180,100,255,0.5)] animate-galaxyPulse"
                : "bg-purple-800/30 text-purple-100 backdrop-blur";

        case "vaporwave":
            return isOwn
                ? "bg-pink-500/30 text-white backdrop-blur shadow-[0_0_10px_#ff71ce]"
                : "bg-cyan-400/20 text-white backdrop-blur";

        case "fire":
            return isOwn
                ? "bg-black text-orange-400 border border-orange-500 shadow-[0_0_12px_rgba(255,100,0,0.7)]"
                : "bg-black text-orange-300 border border-orange-500/50";


        case "forest":
            return isOwn
                ? "bg-green-700/40 text-green-100"
                : "bg-green-600/30 text-green-100";

        case "retro":
            return isOwn
                ? "bg-yellow-400 text-black animate-retroPulse"
                : "bg-orange-300 text-black";

        case "minimal":
            return isOwn
                ? "bg-gray-200 text-black"
                : "bg-white text-gray-800";

        default:
            return isOwn
                ? "bg-pink-400 text-white"
                : "bg-white text-gray-800";
    }
};

    const color = getUserColor(message.user);
    const date = new Date(Number(message.timestamp));
    const hora = !isNaN(date.getTime())
        ? date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
        : "";

    // ---- Acciones ----
    const handleReaction = (emoji) => {
        socket?.emit("Reacción", { messageId: message.id, emoji });
        setShowPicker(false);
    };

    const handleReply = () => {
        setReplyingTo({ id: message.id, user: message.user, content: message.content });
    };

    const handleEdit = () => {
        if (!editValue.trim() || editValue === message.content) {
            setEditing(false);
            return;
        }
        socket?.emit("Editar Mensaje", { messageId: message.id, newContent: editValue });
        setEditing(false);
    };

    const handleDelete = () => {
        socket?.emit("Eliminar Mensaje", { messageId: message.id });
        setShowDeleteConfirm(false);
    };

    // ---- Contenido del mensaje ----
    const renderBody = () => {
        if (message.type === "music") {
            return (
                <MusicCard
                    message={message}
                    onPlayHere={(videoId, title) => {
                        if (typeof onPlayMusic === "function") onPlayMusic(videoId, title);
                    }}
                />
            );
        }
        if (message.deleted) {
            return <p className="text-sm text-gray-400 italic">🚫 Mensaje eliminado</p>;
        }
        if (editing) {
            return (
                <div className="flex flex-col gap-2 w-full">
                    <textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                            if (e.key === "Escape") setEditing(false);
                        }}
                        autoFocus
                        className="w-full text-sm border border-blue-400 rounded-lg p-2 resize-none focus:outline-none bg-white/80"
                        rows={2}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleEdit} className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition">✅ Guardar</button>
                        <button onClick={() => setEditing(false)} className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition">❌ Cancelar</button>
                    </div>
                </div>
            );
        }
        if (message.type === "image") {
            return (
                <img
                    src={message.content}
                    className="max-w-50 max-h-50 rounded-xl cursor-pointer hover:scale-105 transition object-cover"
                    onClick={() => onImageClick(message.content)}
                    alt="imagen"
                />
            );
        }
        if (message.type === "gif") {
            return (
                <img
                    src={message.content}
                    className="max-w-50 rounded-xl cursor-pointer hover:scale-105 transition"
                    onClick={() => onImageClick(message.content)}
                    alt="gif"
                />
            );
        }
        if (message.type === "video") {
            return <video src={message.content} controls className="max-w-50 max-h-50 rounded-xl"/>;
        }
        if (message.type === "audio") {
            return <audio src={message.content} controls className="max-w-50"/>;
        }
        if (message.type === "sticker-emoji") {
            return <span className="text-5xl leading-none">{message.content}</span>;
        }
        if (message.type === "sticker-image") {
            return (
                <div className="relative inline-block group">
                    <img src={message.content} className="max-w-30 max-h-30 object-contain" alt="sticker"/>
                </div>

                
            );
        }
        return (
<p
    className="text-sm leading-relaxed wrap-break-word"
    dangerouslySetInnerHTML={{ __html: highlightMentions(message.content, currentUser) }}
/>
        );
    };

    // ---- Reacciones ----
    const reactions = message.reactions || {};
    const hasReactions = Object.values(reactions).some(users => users.length > 0);

    // ---- Click derecho ----
    const handleContextMenu = (e) => {
        e.preventDefault();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    useEffect(() => {
        const handleClick = () => setShowContextMenu(false);
        if (showContextMenu) {
            document.addEventListener("click", handleClick);
            return () => document.removeEventListener("click", handleClick);
        }
    }, [showContextMenu]);

    return (
        <div 
            className={`flex flex-col ${isOwn ? "items-end" : "items-start"} group mb-0.5 w-full select-none`}
            onContextMenu={handleContextMenu}
            onTouchStart={(e) => {
                longPressTimerRef.current = setTimeout(() => {
                    const touch = e.touches[0];
                    setContextMenuPos({ x: touch.clientX, y: touch.clientY });
                    setShowContextMenu(true);
                }, 500);
            }}
            onTouchEnd={() => {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                }
            }}
            onTouchMove={() => {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                }
            }}
            id={`msg-${message.id}`}
        >
            {/* User Info Modal */}
            {userInfoModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setUserInfoModal(null)}>
                    <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-72 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-full bg-pink-400 flex items-center justify-center text-4xl">
                                {userInfoModal.avatar || "😀"}
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold text-xl">{userInfoModal.nombre}</p>
                                {adminsList.includes(userInfoModal.nombre) && <span className="text-yellow-400 text-sm">👑 Admin</span>}
                            </div>
                            <div className="text-white/60 text-sm text-center mt-2">
                                <p>Usuario desde:</p>
                                <p className="font-bold">{userInfoModal.creado}</p>
                            </div>
                            <button 
                                onClick={() => setUserInfoModal(null)}
                                className="mt-4 bg-pink-400 hover:bg-pink-500 text-white px-6 py-2 rounded-full"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}