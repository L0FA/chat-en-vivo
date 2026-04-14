import { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";

const AVATAR_OPTIONS = [
    "😀", "😎", "🤓", "🥳", "😇", "🤠", "😺", "🦊", "🐶", "🐼",
    "🦁", "🐨", "🦄", "🐸", "🦋", "🌟", "🔥", "💎", "🎮", "🎸",
    "⚽", "🎨", "🚀", "💡", "🎯", "🏆", "🌈", "❤️", "✨", "🌙"
];

export default function ProfileDropdown({ isAdmin = false, socket = null }) {
    const { user, avatar, updateProfile } = useChat();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [newName, setNewName] = useState(user);
    const [newAvatar, setNewAvatar] = useState(avatar);
    const [avatarMode, setAvatarMode] = useState("emoji");
    const fileInputRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                setVisible(true);
                setNewName(user);
                setNewAvatar(avatar || "😀");
            }, 0);
        }
    }, [open, user, avatar]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => { setOpen(false); setEditMode(false); }, 200);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                handleClose();
            }
        };
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const handleSave = () => {
        updateProfile(newName.trim() || "Invitado", newAvatar);
        
        // Enviar avatar al servidor SIEMPRE (si hay un socket)
        if (socket && newAvatar) {
            console.log("📤 Enviando avatar al servidor...", newAvatar.substring(0, 30), "...");
            socket.emit("Actualizar Avatar", { avatar: newAvatar }, (res) => {
                console.log("📤 Respuesta del servidor:", res);
            });
        } else {
            console.log("⚠️ No se envía avatar - socket:", !!socket, "newAvatar:", !!newAvatar);
        }
        
        setEditMode(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("NombreUsuario");
        localStorage.removeItem("UserAvatar");
        localStorage.removeItem("chat-theme");
        localStorage.removeItem("chat-custom-theme");
        localStorage.removeItem("currentRoom");
        window.location.reload();
    };

    const currentAvatar = avatar || "😀";
    const isCurrentImageAvatar = currentAvatar.startsWith("data:image");

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => open ? handleClose() : setOpen(true)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            >
                {isCurrentImageAvatar ? (
                    <img src={currentAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-pink-400 flex items-center justify-center text-lg shadow">
                        {currentAvatar}
                    </div>
                )}
                <div className="text-left">
                    <p className={`text-xs font-bold ${open ? "text-white" : "text-white drop-shadow"}`}>
                        {user}
                        {isAdmin && <span className="ml-1 text-yellow-300">👑</span>}
                    </p>
                    <p className={`text-[10px] ${open ? "text-white/70" : "text-white/50 drop-shadow"}`}>
                        {isAdmin ? "Admin" : "▼"}
                    </p>
                </div>
            </button>

            {open && (
                <div
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
                        transition: "opacity 0.2s ease, transform 0.2s ease"
                    }}
                    className="absolute top-12 left-0 z-50 bg-gray-900/95 border border-white/20 rounded-2xl p-4 shadow-2xl w-72"
                >
                    {!editMode ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                {isCurrentImageAvatar ? (
                                    <img src={currentAvatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover shadow-lg" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-pink-400 flex items-center justify-center text-3xl shadow-lg">
                                        {currentAvatar}
                                    </div>
                                )}
                                <div>
                                    <p className="text-white font-bold text-lg">{user}</p>
                                    <p className="text-white/60 text-xs">En línea</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-blue-500/80 text-white hover:bg-blue-600 transition cursor-pointer"
                                >
                                    ✏️ Editar perfil
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-red-500/80 text-white hover:bg-red-600 transition cursor-pointer"
                                >
                                    🚪
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <p className="text-white text-sm font-bold">✏️ Editar perfil</p>
                            <div className="flex flex-col gap-2">
                                <label className="text-white/70 text-xs">Tu apodo</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Tu nombre..."
                                    className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 text-sm focus:outline-none focus:border-pink-400"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-white/70 text-xs">Tu avatar</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setAvatarMode("emoji")}
                                        className={`flex-1 text-xs px-2 py-1.5 rounded-lg transition cursor-pointer ${
                                            avatarMode === "emoji" ? "bg-pink-500/50 border border-pink-400" : "bg-white/10"
                                        }`}
                                    >
                                        😊 Emoji
                                    </button>
                                    <button
                                        onClick={() => setAvatarMode("photo")}
                                        className={`flex-1 text-xs px-2 py-1.5 rounded-lg transition cursor-pointer ${
                                            avatarMode === "photo" ? "bg-pink-500/50 border border-pink-400" : "bg-white/10"
                                        }`}
                                    >
                                        📷 Foto
                                    </button>
                                </div>
                                {avatarMode === "emoji" ? (
                                    <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1">
                                        {AVATAR_OPTIONS.map((a) => (
                                            <button
                                                key={a}
                                                onClick={() => setNewAvatar(a)}
                                                className={`text-2xl p-1 rounded-lg transition cursor-pointer ${
                                                    newAvatar === a 
                                                        ? "bg-pink-500/50 scale-110" 
                                                        : "hover:bg-white/10"
                                                }`}
                                            >
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        {newAvatar && newAvatar.startsWith("data:image") ? (
                                            <div className="relative">
                                                <img src={newAvatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-pink-400" />
                                                <button
                                                    onClick={() => setNewAvatar("")}
                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl">
                                                👤
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setNewAvatar(reader.result);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs bg-blue-500/80 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition cursor-pointer"
                                        >
                                            {newAvatar && newAvatar.startsWith("data:image") ? "Cambiar foto" : "Subir foto"}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 text-xs bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition cursor-pointer"
                                >
                                    ← Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 text-xs bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition cursor-pointer"
                                >
                                    ✅ Guardar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}