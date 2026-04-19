import React from "react";

export default function UserInfoModal({ user, onClose }) {
    if (!user) return null;

    const isImageAvatar = user.avatar && user.avatar.startsWith("data:image");

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-gray-900/95 border border-white/20 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center gap-4">
                    {isImageAvatar ? (
                        <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-white/20" />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-pink-500 flex items-center justify-center text-4xl border-2 border-white/20">
                            😀
                        </div>
                    )}
                    
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white">{user.nombre}</h3>
                        <p className="text-sm text-white/60 mt-1">Usuario conectado</p>
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