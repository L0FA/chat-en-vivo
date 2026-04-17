import { useState, useRef } from "react";
import { useChat } from "../hooks/useChat";
import EmojiStickerPanel from "./EmojiStickerPanel";
import MediaDropdown from "./MediaDropdown";

export default function MessageInput({ socket, onType, stopTyping, currentRoom }) {
    const { replyingTo, setReplyingTo } = useChat();
    const [input, setInput] = useState("");
    const [showEmojiPanel, setShowEmojiPanel] = useState(false);
    const [sendingId, setSendingId] = useState(null);
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        if (e?.preventDefault) e.preventDefault();
        const messageText = input.trim();
        if (!messageText || !socket || !currentRoom || sendingId) return;

        const localId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSendingId(localId);

        const payload = {
            id: localId,
            msg: messageText,
            timestamp: Date.now(),
            room: currentRoom,
            ...(replyingTo && {
                replyToId: replyingTo.id,
                replyToUser: replyingTo.user,
                replyToText: replyingTo.text
            })
        };

        socket.emit("Mensaje en Chat", payload);
        setInput("");
        setReplyingTo(null);
        setSendingId(null);
        stopTyping();
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        
        if (val.length > 0) {
            onType();
        } else {
            stopTyping();
        }
    };

    return (
        <div className="relative w-full max-w-5xl mx-auto px-4 pb-4 animate-fade-in">
            {replyingTo && (
                <div className="absolute bottom-full left-4 right-4 mb-2 p-3 rounded-t-2xl bg-indigo-600/20 border-x border-t border-indigo-500/30 backdrop-blur-xl flex items-center justify-between gap-4 animate-fade-in">
                    <div className="flex-1 min-w-0">
                        <span className="text-[0.7rem] font-bold text-indigo-400 block mb-0.5 uppercase tracking-wider">Respondiendo a @{replyingTo.user}</span>
                        <p className="text-[0.85rem] text-white/70 truncate italic">{replyingTo.text || "Mensaje"}</p>
                    </div>
                    <button 
                        onClick={() => setReplyingTo(null)}
                        className="p-1.5 rounded-full hover:bg-white/10 text-white/50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            )}

            <div className={`flex items-end gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${replyingTo ? "rounded-t-none border-t-0" : ""}`}>
                <div className="flex items-center gap-1">
                    <button 
                        type="button"
                        onClick={() => setShowEmojiPanel(!showEmojiPanel)}
                        className={`p-2.5 rounded-xl transition-all duration-200 ${showEmojiPanel ? "bg-indigo-500/20 text-indigo-400" : "hover:bg-white/5 text-white/60"}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                    </button>
                    
                    <MediaDropdown socket={socket} currentRoom={currentRoom} />
                </div>

                <textarea
                    ref={inputRef}
                    rows="1"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[0.95rem] py-2.5 px-2 resize-none max-h-32 placeholder:text-white/30"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                />

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!input.trim() || sendingId}
                    className={`p-3 rounded-xl transition-all duration-300 ${input.trim() ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-100" : "bg-white/5 text-white/20 scale-95 cursor-not-allowed"}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>

            {showEmojiPanel && (
                <div className="absolute bottom-full left-4 mb-4 z-50 animate-fade-in">
                    <EmojiStickerPanel 
                        onEmojiSelect={(emoji) => {
                            setInput(prev => prev + emoji);
                            inputRef.current?.focus();
                        }}
                        onClose={() => setShowEmojiPanel(false)}
                    />
                </div>
            )}
        </div>
    );
}
