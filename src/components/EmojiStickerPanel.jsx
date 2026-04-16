import { useState, useEffect, useRef, useCallback } from "react";
import "emoji-picker-element";

const DEFAULT_STICKERS = [
    "😂","😭","🥺","😍","🤣","😊","🙏","💀","❤️","😩",
    "🔥","✨","💯","🎉","👀","😤","🥴","😎","🤡","👑"
];

export default function EmojiStickerPanel({ socket, currentRoom, onEmojiSelect, onClose }) {
    const [tab, setTab] = useState("emojis");
    const [customStickers, setCustomStickers] = useState(() =>
        JSON.parse(localStorage.getItem("customStickers") || "[]")
    );
    const pickerRef = useRef(null);
    const fileRef = useRef(null);

    // Hookear el emoji-picker-element
    useEffect(() => {
        const picker = pickerRef.current;
        if (!picker) return;
        const handler = (e) => {
            onEmojiSelect(e.detail.unicode);
            onClose();
        };
        picker.addEventListener("emoji-click", handler);
        return () => picker.removeEventListener("emoji-click", handler);
    }, [onEmojiSelect, onClose]);

const sendSticker = useCallback((data, tipo) => {
    socket?.emit("Sticker en Chat", { data, tipo, timestamp: Date.now(), room: currentRoom });
    onClose();
}, [socket, onClose, currentRoom]);

    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const src = ev.target.result;
            const saved = JSON.parse(localStorage.getItem("customStickers") || "[]");
            if (!saved.includes(src)) {
                saved.push(src);
                localStorage.setItem("customStickers", JSON.stringify(saved));
                setCustomStickers(saved);
            }
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    return (
        <div className="absolute bottom-14 left-0 w-80 bg-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden z-50 border border-white/10">

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                {[
                    { id: "emojis", label: "😄 Emojis" },
                    { id: "stickers", label: "🎭 Stickers" },
                    { id: "gifs", label: "🎞️ GIFs" }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 py-2 text-xs font-bold transition ${
                            tab === t.id
                                ? "text-white border-b-2 border-yellow-400"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Emojis */}
            {tab === "emojis" && (
                <emoji-picker
                    ref={pickerRef}
                    style={{
                        width: "100%",
                        height: "300px",
                        "--background": "#1e1e1e",
                        "--input-background": "#333",
                        "--input-font-color": "white",
                        "--outline-color": "#ffcc00",
                        "--border-radius": "0"
                    }}
                />
            )}

            {/* Tab Stickers */}
            {tab === "stickers" && (
                <div className="flex flex-col">
                    <div className="grid grid-cols-4 gap-1.5 p-3 max-h-64 overflow-y-auto">
                        {DEFAULT_STICKERS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => sendSticker(emoji, "emoji")}
                                className="text-3xl text-center hover:scale-125 transition p-1 rounded-lg hover:bg-white/10"
                            >
                                {emoji}
                            </button>
                        ))}
                        {customStickers.map((src, i) => (
                            <div key={i} className="relative group">
                                <img
                                    src={src}
                                    onClick={() => sendSticker(src, "image")}
                                    className="w-full aspect-square object-contain rounded-lg cursor-pointer hover:scale-110 transition bg-white/5 p-1"
                                    alt="sticker"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-white/10 p-2">
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="w-full text-yellow-400 text-xs py-2 rounded-lg hover:bg-yellow-400/10 transition"
                        >
                            ➕ Subir sticker
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*,image/gif"
                            className="hidden"
                            onChange={handleUpload}
                        />
                    </div>
                </div>
            )}

            {/* Tab GIFs */}
            {tab === "gifs" && (
                <GifTab socket={socket} onClose={onClose} currentRoom={currentRoom} />
            )}
        </div>
    );
}

function GifTab({ socket, onClose, currentRoom }) {
    const [query, setQuery] = useState("");
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const searchTimeout = useRef(null);

    useEffect(() => {
        loadGifs("trending");
    }, []);

    const loadGifs = async (q) => {
        setLoading(true);
        try {
            const endpoint = q === "trending"
                ? "/api/giphy/trending"
                : `/api/giphy/search?q=${encodeURIComponent(q)}`;
            const res = await fetch(endpoint);
            const data = await res.json();
            setGifs(data.data || []);
        } catch (err) {
            console.error("Error Giphy:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const q = e.target.value;
        setQuery(q);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            loadGifs(q || "trending");
        }, 500);
    };

    const sendGif = (url) => {
        socket?.emit("GIF en Chat", { url, timestamp: Date.now(), room: currentRoom });
        onClose();
    };

    return (
        <div className="flex flex-col">
            <div className="flex gap-2 p-2 border-b border-white/10">
                <input
                    type="text"
                    value={query}
                    onChange={handleSearch}
                    placeholder="Buscar GIFs..."
                    className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-yellow-400 placeholder-gray-500"
                />
            </div>
            <div className="grid grid-cols-2 gap-1 p-2 max-h-64 overflow-y-auto">
                {loading && (
                    <div className="col-span-2 text-center text-gray-400 text-sm py-8">
                        Cargando...
                    </div>
                )}
                {!loading && gifs.map(gif => {
                    const url = gif.images?.fixed_height?.url;
                    const preview = gif.images?.fixed_height_small?.url || url;
                    if (!url) return null;
                    return (
                        <img
                            key={gif.id}
                            src={preview}
                            onClick={() => sendGif(url)}
                            loading="lazy"
                            className="w-full aspect-video object-cover rounded-lg cursor-pointer hover:scale-105 transition bg-white/5"
                            alt="gif"
                        />
                    );
                })}
            </div>
            <p className="text-center text-gray-600 text-xs py-1">Powered by GIPHY</p>
        </div>
    );
}