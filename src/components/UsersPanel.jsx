import { useState } from "react";
import { useChat } from "../hooks/useChat";

export default function UsersPanel({ onUserClick }) {
    const { connectedUsers, user } = useChat();
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 text-sm font-bold cursor-pointer transition backdrop-blur-sm"
            >
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]"/>
                👥 <span className="text-white/90">{connectedUsers.length}</span>
            </button>

            {open && (
                <div className="absolute top-10 right-0 bg-gray-900/95 border border-white/20 rounded-xl w-52 max-h-80 overflow-y-auto shadow-2xl z-50 backdrop-blur-xl">
                    <div className="flex justify-between items-center px-3 py-2 border-b border-white/10">
                        <span className="text-white text-sm font-bold">👥 Conectados</span>
                        <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-sm hover:scale-110 transition">✖</button>
                    </div>
                    <ul className="p-2 flex flex-col gap-1">
                        {connectedUsers.map((u, i) => {
                            const nombre = typeof u === "string" ? u : u?.nombre || "Usuario";
                            const avatar = typeof u === "string" ? null : u?.avatar;
                            const isMe = nombre === user;
                            const isImageAvatar = avatar && avatar.startsWith("data:image");
                            
                            return (
                            <li 
                                key={`${nombre}-${i}`} 
                                onClick={() => { onUserClick?.(nombre); setOpen(false); }}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-white cursor-pointer ${isMe ? "bg-blue-500/20" : "hover:bg-white/10"}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)] shrink-0"/>
                                {isImageAvatar ? (
                                    <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                    <span className="text-sm">😀</span>
                                )}
                                <span className="flex-1 truncate">{nombre}</span>
                                {isMe && <span className="text-xs bg-blue-500/30 text-blue-300 px-1.5 rounded-full">vos</span>}
                            </li>
                        );})}
                    </ul>
                </div>
            )}
        </div>
    );
}