import React from "react";

export default function UserInfoModal({ user, onClose }) {
    if (!user) return null;

    const isImageAvatar = user.avatar && user.avatar.startsWith("data:image");
    
    const formatDate = (dateStr) => {
        if (!dateStr) return "No disponible";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
        } catch {
            return "No disponible";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-gray-900/95 border border-white/20 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center gap-4">
                    {isImageAvatar ? (
                        <img src={user.avatar} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-white/20" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-pink-500 flex items-center justify-center text-5xl border-2 border-white/20">
                            😀
                        </div>
                    )}
                    
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-white">{user.nombre}</h3>
                        {user.isAdmin && (
                            <span className="inline-block mt-2 px-3 py-1 bg-indigo-500/30 text-indigo-400 text-xs rounded-full font-medium">
                                👑 Administrador
                            </span>
                        )}
                    </div>

                    <div className="w-full border-t border-white/10 pt-4 mt-2">
                        <div className="flex justify-between items-center py-2">
                            <span className="text-white/50 text-sm">Fecha de creación</span>
                            <span className="text-white/80 text-sm">{formatDate(user.creado)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-white/50 text-sm">Estado</span>
                            <span className="text-green-400 text-sm">🟢 Conectado</span>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}