import { useState } from "react";
import { useChat } from "../hooks/useChat";

export default function UsersPanel() {
    const { connectedUsers, user } = useChat();
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1 bg-white/90 border border-gray-200 rounded-full px-3 py-1 text-sm font-bold cursor-pointer hover:scale-105 transition"
            >
                👥 <span>{connectedUsers.length}</span>
            </button>

            {open && (
                <div className="absolute top-10 right-0 bg-[#1a1a2e] border border-white/10 rounded-xl w-48 max-h-72 overflow-y-auto shadow-2xl z-50">
                    <div className="flex justify-between items-center px-3 py-2 border-b border-white/10">
                        <span className="text-white text-sm font-bold">👥 Conectados</span>
                        <button onClick={() => setOpen(false)} className="text-white text-sm hover:scale-110 transition">✖</button>
                    </div>
                    <ul className="p-2 flex flex-col gap-1">
                        {connectedUsers.map(u => (
                            <li key={u} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-white ${u === user ? "bg-blue-500/20" : "hover:bg-white/5"}`}>
                                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)] flex-shrink-0"/>
                                <span className="flex-1 truncate">{u}</span>
                                {u === user && <span className="text-xs bg-blue-500/30 text-blue-300 px-1.5 rounded-full">vos</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}