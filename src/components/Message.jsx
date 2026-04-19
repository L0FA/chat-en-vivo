import React from "react";
import { useChat } from "../hooks/useChat";
import { MusicCard } from "./MusicPanel";

function linkify(text) {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline transition-colors">$1</a>');
}

function getUserColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 60%)`;
}

function highlightMentions(text, currentUser) {
    if (!text) return "";
    return text.replace(/@(\w+)/g, (match, u) => {
        const isMe = u === currentUser;
        return `<span class="${isMe ? "text-pink-400 font-bold bg-pink-500/10 rounded px-1" : "text-indigo-400 font-bold"}">${match}</span>`;
    });
}

function MessageInner({ message, currentUser, onImageClick, onPlayMusic, adminsList = [], socket, userAvatar: propAvatar, isUserAdmin = false, theme = "default", onUserClick, highlightedMessageId, onReplyClick }) {
    const { setReplyingTo } = useChat();
    const isMe = message.user === currentUser;
    const isAdmin = adminsList.includes(message.user);
    const canEdit = isMe || isUserAdmin;
    const userColor = getUserColor(message.user);
    const [showMenu, setShowMenu] = React.useState(false);
    const [menuPosition, setMenuPosition] = React.useState("right");
    const [showReactions, setShowReactions] = React.useState(false);
    const menuRef = React.useRef(null);
    const msgRef = React.useRef(null);

    const userAvatar = propAvatar || message.senderAvatar;
    const isLightTheme = ["default", "retro", "ocean", "forest", "rosa", "minimal"].includes(theme);
    const textClass = isLightTheme ? "text-gray-900" : "text-white drop-shadow-md";
    const isHighlighted = highlightedMessageId === message.id;

    React.useEffect(() => {
        if (isHighlighted && msgRef.current) {
            msgRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            msgRef.current.classList.add("ring-2", "ring-yellow-400");
            setTimeout(() => msgRef.current?.classList.remove("ring-2", "ring-yellow-400"), 2000);
        }
    }, [isHighlighted]);

    const handleContextMenu = (e) => {
        e.preventDefault();
        const windowWidth = window.innerWidth;
        const clickX = e.clientX;
        const isRightSide = clickX > windowWidth / 2;
        setMenuPosition(isRightSide ? "left" : "right");
        setShowMenu(true);
    };

    const handleEdit = () => {
        setShowMenu(false);
        const newContent = prompt("Editar mensaje:", message.content);
        if (newContent && newContent !== message.content && socket && message.id) {
            socket.emit("Editar Mensaje", { messageId: message.id, newContent }, (res) => {
                if (res?.status !== "ok") {
                    alert("Error al editar mensaje");
                }
            });
        }
    };

    const handleDelete = () => {
        if (socket && message.id) {
            socket.emit("Eliminar Mensaje", { messageId: message.id });
        }
        setShowMenu(false);
    };

    const handleReply = () => {
        setReplyingTo({ id: message.id, user: message.user, text: message.content });
        setShowMenu(false);
    };

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
                setShowReactions(false);
            }
        };
        if (showMenu || showReactions) {
            document.addEventListener("click", handleClickOutside);
            return () => document.removeEventListener("click", handleClickOutside);
        }
    }, [showMenu, showReactions]);

    const renderContent = () => {
        if (message.type === "image") {
            return (
                <div className="mt-1 overflow-hidden rounded-xl border border-white/10 shadow-inner">
                    <img 
                        src={message.content} 
                        alt="Imagen enviada" 
                        className="max-w-full h-auto cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
                        onClick={() => onImageClick(message.content)}
                    />
                </div>
            );
        }
        if (message.type === "video") {
            return (
                <div className="mt-1 overflow-hidden rounded-xl border border-white/10 shadow-inner bg-black/20">
                    <video src={message.content} controls className="max-w-full h-auto" />
                </div>
            );
        }
        if (message.type === "audio") {
            return (
                <div className="mt-2 px-1">
                    <audio src={message.content} controls className="w-full h-8 opacity-90" />
                </div>
            );
        }
        if (message.type === "sticker") {
            return (
                <div className="mt-1">
                    <img src={message.content} alt="Sticker" className="w-32 h-32 object-contain drop-shadow-lg" />
                </div>
            );
        }
        if (message.type === "music") {
            return <MusicCard song={message.content} onPlay={onPlayMusic} />;
        }
        
        const htmlContent = highlightMentions(linkify(message.content), currentUser);
        return (
            <p 
                className={`text-[1rem] leading-relaxed wrap-break-word whitespace-pre-wrap ${textClass}`}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        );
    };

    const handleAddReaction = (emoji) => {
        if (socket && message.id) {
            socket.emit("Agregar Reacción", { messageId: message.id, emoji, user: currentUser });
        }
        setShowReactions(false);
    };

    const reactions = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👎"];

    return (
        <div ref={msgRef} className={`flex flex-col ${isMe ? "items-end" : "items-start"} group animate-fade-in relative`} onContextMenu={handleContextMenu}>
            {!isMe && (
                <div className="flex items-center gap-1.5 mb-1 ml-2">
                    {userAvatar && userAvatar.startsWith("data:image") && (
                        <img src={userAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                    )}
                    <span 
                        onClick={() => onUserClick?.(message.user)}
                        className="text-[0.7rem] font-bold flex items-center gap-1.5 cursor-pointer hover:underline"
                        style={{ color: userColor }}
                    >
                        {message.user}
                        {isAdmin && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md text-[0.6rem] uppercase tracking-wider">Admin</span>}
                    </span>
                </div>
            )}
            
            <div className={`message-bubble ${isMe ? "message-mine" : "message-other"} ${isHighlighted ? "ring-2 ring-yellow-400" : ""}`}>
                {(message.replyToUser || message.replyToContent) && (
                    <div 
                        onClick={() => onReplyClick?.(message.replyToId)}
                        className={`mb-2 p-2 rounded-lg border-l-4 text-[0.8rem] italic truncate cursor-pointer hover:opacity-100 transition ${isLightTheme ? "bg-gray-100/80 border-indigo-500/70 text-gray-700" : "bg-black/20 border-indigo-500/50 text-white/80"}`}
                    >
                        <span className={`font-bold not-italic block mb-0.5 ${isLightTheme ? "text-indigo-600" : ""}`}>@{message.replyToUser || "Usuario"}</span>
                        {message.replyToContent || message.replyToText || "Mensaje"}
                    </div>
                )}
                
                {renderContent()}
                
                <div className="flex items-center justify-end gap-2 mt-1.5 text-[0.7rem] text-white/70">
                    <span>{new Date(message.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && (
                        <span className="text-indigo-400 font-bold">✓✓</span>
                    )}
                </div>

                {/* Acciones rápidas al hover */}
                <div className={`absolute top-0 ${isMe ? "-left-10" : "-right-10"} opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-1`}>
                    <button 
                        onClick={handleReply}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                        title="Responder"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                    </button>
                </div>

                {/* Menú contextual (click derecho) */}
                {showMenu && (
                    <div ref={menuRef} className={`absolute top-0 z-50 bg-gray-900/95 border border-white/20 rounded-lg shadow-xl py-1 min-w-[140px] ${menuPosition === "left" ? "right-0" : "left-0"}`}>
                        <button onClick={() => { setShowMenu(false); setShowReactions(true); }} className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">😀 Reaccionar</button>
                        {canEdit && (
                            <button onClick={handleEdit} className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">✏️ Editar</button>
                        )}
                        <button onClick={handleDelete} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/10 hover:text-red-300 transition-colors">🗑️ Eliminar</button>
                        <button onClick={handleReply} className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">↩️ Responder</button>
                    </div>
                )}

                {/* Panel de reacciones */}
                {showReactions && (
                    <div className="absolute bottom-full mb-1 z-50 bg-gray-900/95 border border-white/20 rounded-lg shadow-xl py-1 flex gap-1">
                        {reactions.map(emoji => (
                            <button key={emoji} onClick={() => handleAddReaction(emoji)} className="p-1.5 hover:bg-white/10 rounded transition text-lg">{emoji}</button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default React.memo(MessageInner);
