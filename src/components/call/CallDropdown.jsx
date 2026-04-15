// ============================================
// 📞 CALL DROPDOWN - Dropdown para seleccionar usuario a llamar
// Muestra lista de usuarios conectados con botones de llamada audio/video
// Archivo: src/components/call/CallDropdown.jsx
// ============================================

import { useChat } from "../../hooks/useChat";

/**
 * Dropdown que aparece al presionar el botón de llamar
 * @param {boolean} show - Si está visible
 * @param {function} onClose - Cerrar dropdown
 * @param {function} onCall - Función para iniciar llamada (user, type)
 */
export default function CallDropdown({ show, onClose, onCall }) {
    const { user, connectedUsers } = useChat();

    if (!show) return null;

    const otherUsers = connectedUsers.filter(u => {
        const nombre = typeof u === "string" ? u : u?.nombre;
        return nombre !== user;
    });

    return (
        <div className="fixed inset-0 z-[9998]">
            <div 
                className="absolute inset-0 bg-black/40" 
                onClick={onClose}
            />
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-white/20 rounded-2xl p-4 shadow-2xl min-w-72 animate-scale-in">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-bold">📞 Llamar</span>
                    <button 
                        onClick={onClose}
                        className="text-white/50 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
                
                {otherUsers.length === 0 ? (
                    <div className="text-white/30 text-sm text-center py-4">No hay usuarios disponibles</div>
                ) : (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                        {otherUsers.map(u => {
                            const nombre = typeof u === "string" ? u : u?.nombre;
                            const avatar = typeof u === "string" ? null : u?.avatar;
                            const isImage = avatar && avatar.startsWith("data:image");
                            
                            return (
                                <div key={nombre} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition">
                                    {isImage ? (
                                        <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center text-xl">😀</div>
                                    )}
                                    <span className="flex-1 text-white font-medium truncate">{nombre}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => onCall(nombre, "audio")}
                                            className="w-9 h-9 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-white"
                                            title="Llamada de voz"
                                        >
                                            🎤
                                        </button>
                                        <button
                                            onClick={() => onCall(nombre, "video")}
                                            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white"
                                            title="Videollamada"
                                        >
                                            📹
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}