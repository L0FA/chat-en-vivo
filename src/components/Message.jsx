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

function MessageInner({ message, currentUser, onImageClick, onPlayMusic, adminsList = [] }) {
    const { setReplyingTo } = useChat();
    const isMe = message.user === currentUser;
    const isAdmin = adminsList.includes(message.user);
    const userColor = getUserColor(message.user);

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
                className="text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        );
    };

    return (
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} group animate-fade-in`}>
            {!isMe && (
                <span className="text-[0.7rem] font-bold mb-1 ml-2 flex items-center gap-1.5" style={{ color: userColor }}>
                    {message.user}
                    {isAdmin && <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md text-[0.6rem] uppercase tracking-wider">Admin</span>}
                </span>
            )}
            
            <div className={`message-bubble ${isMe ? "message-mine" : "message-other"}`}>
                {message.replyToUser && (
                    <div className="mb-2 p-2 rounded-lg bg-black/10 border-l-4 border-indigo-500/50 text-[0.8rem] opacity-80 italic truncate">
                        <span className="font-bold not-italic block mb-0.5">@{message.replyToUser}</span>
                        {message.replyToText || "Mensaje"}
                    </div>
                )}
                
                {renderContent()}
                
                <div className="flex items-center justify-end gap-2 mt-1.5 opacity-60 text-[0.65rem]">
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && (
                        <span className="text-indigo-400 font-bold">✓✓</span>
                    )}
                </div>

                {/* Acciones rápidas al hover */}
                <div className={`absolute top-0 ${isMe ? "-left-10" : "-right-10"} opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-1`}>
                    <button 
                        onClick={() => setReplyingTo({ id: message.id, user: message.user, text: message.content })}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                        title="Responder"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default React.memo(MessageInner);
