import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "../hooks/useChat";

export default function RoomSelector({ scrolled, socket }) {
    const { currentRoom, changeRoom, userRooms, addUserRoom, removeUserRoom } = useChat();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [newRoomDesc, setNewRoomDesc] = useState("");
    const [inviteMode, setInviteMode] = useState(false);
    const [inviteUser, setInviteUser] = useState("");
    const dropdownRef = useRef(null);

    const current = userRooms.find(r => r.id === currentRoom);
    const isCurrentUserAdmin = current?.esAdmin === 1;

    useEffect(() => {
        if (open) {
            setTimeout(() => setVisible(true), 0);
            if (socket) {
                socket.emit("Obtener Mis Salas", (res) => {
                    if (res.status === "ok") {
                        res.salas.forEach(s => addUserRoom(s));
                    }
                });
            }
        }
    }, [open, socket, addUserRoom]);

    // Función de cierre declarada antes del useEffect que la usa
    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(() => { setOpen(false); setShowCreate(false); setInviteMode(false); }, 200);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                handleClose();
            }
        };
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, handleClose]);

    const handleCreateRoom = () => {
        if (!newRoomName.trim() || !socket) return;
        socket.emit("Crear Sala", { nombre: newRoomName.trim(), descripcion: newRoomDesc.trim() }, (res) => {
            if (res.status === "ok") {
                addUserRoom(res.sala);
                changeRoom(res.sala.id);
                setNewRoomName("");
                setNewRoomDesc("");
                setShowCreate(false);
            }
        });
    };

    const handleInvite = () => {
        if (!inviteUser.trim() || !currentRoom || !socket) return;
        socket.emit("Invitar a Sala", { salaId: currentRoom, usuario: inviteUser.trim() }, (res) => {
            if (res.status === "ok") {
                setInviteUser("");
                setInviteMode(false);
            }
        });
    };

    useEffect(() => {
        if (!socket) return;
        
        socket.on("Invitacion Recibida", ({ salaId, nombre, invitedBy }) => {
            if (confirm(`👋 ${invitedBy} te invitó a la sala "${nombre}". ¿Unirte?`)) {
                socket.emit("Unirse Sala", { salaId }, (res) => {
                    if (res.status === "ok") {
                        addUserRoom(res.sala);
                        changeRoom(res.sala.id);
                    }
                });
            }
        });

        socket.on("Sala Eliminada", ({ salaId }) => {
            removeUserRoom(salaId);
        });

        return () => {
            socket.off("Invitacion Recibida");
            socket.off("Sala Eliminada");
        };
    }, [socket, addUserRoom, changeRoom, removeUserRoom]);

    const handleDeleteRoom = () => {
        if (!currentRoom || !socket) return;
        if (confirm("¿Eliminar esta sala? Se borrarán todos los mensajes.")) {
            socket.emit("Eliminar Sala", { salaId: currentRoom }, (res) => {
                if (res.status === "ok") {
                    removeUserRoom(currentRoom);
                }
            });
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => open ? handleClose() : setOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:scale-105 transition border border-white/20 cursor-pointer backdrop-blur-sm ${
                    scrolled 
                        ? "bg-white/90 text-gray-800 border-gray-200" 
                        : "bg-white/20 text-white border-white/30"
                }`}
            >
                <span>{current ? (current.esAdmin ? "💎" : "💬") : "💬"}</span>
                <span className="hidden sm:inline">{current ? current.nombre : "Sin sala"}</span>
                {current && current.id !== "sala-admins-global" && (
                    <span className="text-[10px] opacity-50 ml-1" title="ID de sala">{current.id.slice(0, 8)}</span>
                )}
                {isCurrentUserAdmin && <span className="text-[8px] bg-yellow-500 text-black px-1 rounded font-bold">ADMIN</span>}
                <span className="text-xs opacity-70">{open ? "▲" : "▼"}</span>
            </button>

            {open && (
                <div
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
                        transition: "opacity 0.2s ease, transform 0.2s ease"
                    }}
                    className="absolute top-10 left-0 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl w-72 max-h-96 overflow-y-auto"
                >
                    {!showCreate ? (
                        <>
                            <p className="text-white text-xs font-bold mb-2 px-1 drop-shadow">🏠 Tus salas</p>
                            <div className="flex flex-col gap-2 mb-3">
                                {userRooms.length === 0 ? (
                                    <p className="text-white/50 text-xs px-2 py-4 text-center">No tenés salas aún</p>
                                ) : (
                                    userRooms.map((room, i) => (
                                        <button
                                            key={room.id}
                                            onClick={() => { changeRoom(room.id); handleClose(); }}
                                            style={{
                                                opacity: visible ? 1 : 0,
                                                transition: `opacity 0.2s ease ${i * 0.03}s`
                                            }}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                                currentRoom === room.id
                                                    ? "bg-white/20 border border-white/40"
                                                    : "hover:bg-white/10 border border-transparent"
                                            }`}
                                        >
                                            <span className="text-xl">{room.esAdmin ? "💎" : "💬"}</span>
                                            <div className="text-left">
                                                <div className="text-white flex items-center gap-1">
                                                    {room.nombre}
                                                    {room.esAdmin === 1 && (
                                                        <span className="text-[10px] bg-yellow-500/80 text-black px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                                                    )}
                                                </div>
                                                {room.descripcion && (
                                                    <div className="text-xs text-white/60">{room.descripcion}</div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border-2 border-dashed border-white/40 hover:border-white/80 hover:bg-white/10 transition cursor-pointer"
                            >
                                <span>➕</span>
                                <span>Crear nueva sala</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <p className="text-white text-sm font-bold">➕ Nueva sala</p>
                            <input
                                type="text"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="Nombre de la sala..."
                                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 text-sm focus:outline-none focus:border-pink-400"
                            />
                            <input
                                type="text"
                                value={newRoomDesc}
                                onChange={(e) => setNewRoomDesc(e.target.value)}
                                placeholder="Descripción (opcional)..."
                                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 text-sm focus:outline-none focus:border-pink-400"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 text-xs bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition cursor-pointer"
                                >
                                    ← Volver
                                </button>
                                <button
                                    onClick={handleCreateRoom}
                                    className="flex-1 text-xs bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition cursor-pointer"
                                >
                                    ✅ Crear
                                </button>
                            </div>
                        </div>
                    )}

                    {currentRoom && !showCreate && (
                        <div className="border-t border-white/20 mt-3 pt-3">
                            {inviteMode ? (
                                <div className="flex flex-col gap-2">
                                    <p className="text-white/70 text-xs">Invitar usuario:</p>
                                    <input
                                        type="text"
                                        value={inviteUser}
                                        onChange={(e) => setInviteUser(e.target.value)}
                                        placeholder="Nombre de usuario..."
                                        className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 text-sm focus:outline-none focus:border-pink-400"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setInviteMode(false)}
                                            className="flex-1 text-xs bg-white/20 text-white px-3 py-2 rounded-lg cursor-pointer"
                                        >
                                            ←
                                        </button>
                                        <button
                                            onClick={handleInvite}
                                            className="flex-1 text-xs bg-blue-500 text-white px-3 py-2 rounded-lg cursor-pointer"
                                        >
                                            ✉️ Invitar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setInviteMode(true)}
                                        className="flex-1 text-xs bg-blue-500/80 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer"
                                    >
                                        ✉️ Invitar
                                    </button>
                                    <button
                                        onClick={handleDeleteRoom}
                                        className="text-xs bg-red-500/80 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition cursor-pointer"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}