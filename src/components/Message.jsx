import { useState } from "react";
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

export default function Message({ message, currentUser, socket, onImageClick, onPlayMusic }) {
    const { setReplyingTo, theme } = useChat();
    const [showPicker, setShowPicker] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(message.content);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    

    const isOwn = message.user === currentUser;
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
        // En renderBody(), antes del return final:
if (message.type === "music") {
    return (
        <MusicCard
            message={message}
            onPlayHere={(videoId, title) => {
                // Necesitamos subir esto al Chat — lo manejamos con prop
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

    return (
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} group mb-0.5 w-full`}>

            {/* Reply preview */}
            {message.replyToUser && (
                <div className={`text-xs px-3 py-1 mb-1 rounded-lg border-l-2 border-blue-400 bg-blue-50/50 max-w-65 truncate ${isOwn ? "self-end" : "self-start"}`}>
                    <span className="font-bold text-blue-500">{message.replyToUser}:</span> respondiendo...
                </div>
            )}

            <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>

                {/* Bubble */}
<div className={`relative w-fit max-w-[72vw] sm:max-w-[320px] px-3 py-2 rounded-2xl shadow-sm ${
    getThemeStyles()
} ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"} ${
    message.pending ? "opacity-60" : ""
}`}>


                    {/* Nombre */}
                    {!isOwn && (
                        <span className="text-xs font-bold mb-1 block" style={{ color }}>
                            {message.user}
                        </span>
                    )}

                    {renderBody()}

                    {/* Edited tag */}
                    {!!message.edited && !message.deleted && (
                        <span className="text-xs opacity-60 italic ml-1">(editado)</span>
                    )}

                    {/* Hora + tick */}
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                        <span className="text-xs opacity-60">{hora}</span>
                        {isOwn && (
                            <span className={`text-xs ${message.read ? "text-blue-200" : "opacity-60"}`}>
                                {message.pending ? "⏳" : message.read ? "✓✓" : "✓"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Acciones en hover (desktop) o always visible (mobile) */}
                <div className={`flex flex-col gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity ${isOwn ? "items-end" : "items-start"}`}>
                    {/* Reaccionar */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPicker(p => !p)}
                            className="text-sm bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer active:scale-95"
                            aria-label="Reaccionar"
                        >
                            😄
                        </button>
                        {showPicker && (
                            <div className={`absolute ${isOwn ? "right-10" : "left-10"} top-0 flex gap-1 bg-[#1e1e1e] rounded-full px-3 py-2 shadow-xl z-50`}>
                                {QUICK_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className="text-xl hover:scale-125 transition p-1"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Responder */}
                    <button
                        onClick={handleReply}
                        className="text-sm bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer active:scale-95"
                        aria-label="Responder"
                    >
                        ↩️
                    </button>

                    {/* Editar/Eliminar (solo propios) */}
                    {isOwn && !message.deleted && (
                        <>
                            <button
                                onClick={() => { setEditing(true); setEditValue(message.content); }}
                                className="text-sm bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer active:scale-95"
                                aria-label="Editar"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-sm bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer active:scale-95"
                                aria-label="Eliminar"
                            >
                                🗑️
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Reacciones */}
            {hasReactions && (
                <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                    {Object.entries(reactions).map(([emoji, users]) =>
                        users.length > 0 ? (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                title={users.join(", ")}
                                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition hover:scale-105 ${
                                    users.includes(currentUser)
                                        ? "bg-blue-100 border-blue-400 text-blue-600"
                                        : "bg-white border-gray-200 text-gray-600"
                                }`}
                            >
                                {emoji} <span className="font-bold">{users.length}</span>
                            </button>
                        ) : null
                    )}
                </div>
            )}

            {/* Confirm delete */}
            {showDeleteConfirm && (
                <div className="flex items-center gap-2 mt-1 bg-[#1a1a2e] text-white text-xs px-3 py-2 rounded-xl shadow-lg">
                    <span>¿Eliminar?</span>
                    <button onClick={handleDelete} className="bg-red-500 px-2 py-1 rounded-lg hover:bg-red-600 transition">🗑️ Sí</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="bg-gray-600 px-2 py-1 rounded-lg hover:bg-gray-700 transition">❌ No</button>
                </div>
            )}
        </div>
    );
}