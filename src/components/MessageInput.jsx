import { useState, useRef } from "react";
import { useChat } from "../hooks/useChat";
import EmojiStickerPanel from "./EmojiStickerPanel";
import MediaDropdown from "./MediaDropdown";

export default function MessageInput({ socket, onType, stopTyping, currentRoom }) {
    const { replyingTo, setReplyingTo } = useChat();
    const [input, setInput] = useState("");
    const [showEmojiPanel, setShowEmojiPanel] = useState(false);
    const inputRef = useRef(null);
    const bubbleContainerRef = useRef(null);
    const typingCountRef = useRef(0);


    const handleSubmit = (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!input.trim() || !socket || !currentRoom) return;

        const localId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const payload = {
            id: localId,
            msg: input,
            timestamp: Date.now(),
            room: currentRoom,
            ...(replyingTo && {
                replyToId: replyingTo.id,
                replyToUser: replyingTo.user,
                replyToContent: (replyingTo.content || "").substring(0, 100)
            })
        };
        
        console.log("📝 Enviando mensaje con replyTo:", payload);
        console.log("📝 Socket exists:", !!socket, "currentRoom:", currentRoom, "socket.connected:", socket?.connected);
        
        if (!socket?.connected) {
            console.log("📝 [ERROR] Socket no conectado!");    
        }
        
        socket.emit("Mensaje en Chat", payload, (response) => {
            console.log("📝 [CLIENT] Respuesta del servidor:", response);
        });
        
        setInput("");
        setReplyingTo(null);
        stopTyping();
        inputRef.current?.focus();
    };

const handleChange = (e) => {
    setInput(e.target.value);
    if (currentRoom) {
        onType(currentRoom);
    }

    typingCountRef.current++;

    if (typingCountRef.current % 3 === 0) {
        createBubble();

        window.dispatchEvent(new Event("user-typing"));

    }
};




    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const createBubble = () => {
    if (!bubbleContainerRef.current) return;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    // posición horizontal dentro del input
    bubble.style.left = Math.random() * 100 + "%";

    bubbleContainerRef.current.appendChild(bubble);

    setTimeout(() => {
        bubble.remove();
    }, 2000);
};


    return (
        <div
    className="shrink-0 border-t border-pink-100 bg-white/80 backdrop-blur px-3 py-2 flex flex-col gap-2"
    style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
>

            {/* Reply box */}
            {replyingTo && (
                <div className="flex items-center justify-between bg-blue-50 border-l-4 border-blue-400 px-3 py-1.5 rounded-lg text-sm">
                    <span className="text-blue-600 truncate">
                        📝 Respondiendo a <strong>{replyingTo.user}</strong>
                    </span>
                    <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="text-blue-400 hover:text-red-500 transition ml-2 shrink-0 cursor-pointer"
                    >
                        ✖
                    </button>
                </div>
            )}

            {/* Input row */}
            <div className="flex items-center gap-2">

                {/* Emoji/Sticker panel */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPanel(p => !p)}
                        className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-lg hover:scale-110 transition shrink-0 cursor-pointer"
                    >
                        😊
                    </button>
                    {showEmojiPanel && (
                        <EmojiStickerPanel
                            socket={socket}
                            onEmojiSelect={(emoji) => setInput(prev => prev + emoji)}
                            onClose={() => setShowEmojiPanel(false)}
                        />
                    )}
                </div>

                {/* Input + submit */}
                <div className="relative flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2">
    
    {/* 🫧 contenedor de burbujas */}
    <div
        ref={bubbleContainerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
    />

    <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Escribí un mensaje..."
        autoComplete="off"
        className="flex-1 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
    />

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!input.trim()}
                        className="text-pink-400 hover:text-pink-600 transition disabled:opacity-30 cursor-pointer"
                    >
                        ➤
                    </button>
                </div>

                {/* Media dropdown */}
                <MediaDropdown socket={socket} />

            </div>
        </div>
    );
}