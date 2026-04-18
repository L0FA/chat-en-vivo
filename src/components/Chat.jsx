import { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useSocket } from "../hooks/useSocket";
import { useMessages } from "../hooks/useMessages";
import { useTyping } from "../hooks/useTyping";
import { useTheme } from "../hooks/useTheme";
import Message from "./Message";
import MessageInput from "./MessageInput";
import ThemeSelector from "./ThemeSelector";
import RoomSelector from "./RoomSelector";
import UsersPanel from "./UsersPanel";
import Lightbox from "./Lightbox";
import MusicApp from "./MusicApp";
import VideoCall from "./VideoCall";
import ProfileDropdown from "./ProfileDropdown";
import Settings from "./Settings";

export default function Chat() {
    const { user, password, avatar, messages, prependMessages, typingUsers, lightboxSrc, setLightboxSrc, currentRoom, setConnectedUsers, addUserRoom, adminsList } = useChat();
    const { socket, connected: isConnected, isAdmin: userIsAdmin } = useSocket(user, password);
    const { theme } = useTheme();
    
    const { historialListo, hasMore, loadOlder } = useMessages(socket, currentRoom);
    const { onType, stopTyping } = useTyping(socket);
    const [scrolled, setScrolled] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userIsAdminFlag, setUserIsAdminFlag] = useState(() => localStorage.getItem("user-is-admin") === "true");

    const mensajesRef = useRef(null);
    const bottomRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [showMusicApp, setShowMusicApp] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [callTrigger, setCallTrigger] = useState(0);

    

    // Efecto para actualizar título con notificaciones
    useEffect(() => {
        if (unreadCount > 0) {
            document.title = `💬 (${unreadCount}) L0FAChat`;
        } else {
            document.title = "💬 L0FAChat";
        }
    }, [unreadCount]);

    // Función para obtener colores de contraste según el tema
    const getNavbarButtonStyle = () => {
        if (scrolled) {
            return "bg-white/90 border-gray-200 text-gray-800";
        }
        const lightThemes = ["rosa", "minimal", "retro", "ocean", "forest"];
        if (lightThemes.includes(theme)) {
            return "bg-black/50 border-white/30 text-white backdrop-blur-sm";
        }
        return "bg-white/20 border-white/30 text-white backdrop-blur-sm";
    };

    // Efecto para contar mensajes no leídos
    useEffect(() => {
        if (!socket || !historialListo) return;
        
        const playNotificationSound = () => {
            const notificationSound = localStorage.getItem("notification-sound") || "default";
            if (notificationSound === "none") return;
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === "suspended") audioCtx.resume();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.frequency.value = 600;
                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.2);
            } catch { /* silence */ }
        };
        
        const handleNewMessage = (msg) => {
            if (msg.user !== user && !isAtBottom) {
                setUnreadCount(prev => prev + 1);
                playNotificationSound();
            } else if (msg.user !== user) {
                playNotificationSound();
            }
        };
        
        socket.on("Mensaje en Chat", handleNewMessage);
        return () => socket.off("Mensaje en Chat", handleNewMessage);
    }, [socket, user, isAtBottom, historialListo]);

    const loadedRef = useRef(false);

    useEffect(() => {
        loadedRef.current = false;
    }, [user]);

    useEffect(() => {
        if (!socket || loadedRef.current) return;
        
        const loadInitialData = () => {
            console.log("📥 [CHAT] Cargando datos iniciales...");
            
            // Cargar salas
            socket.emit("Obtener Mis Salas", (res) => {
                if (res.status === "ok") {
                    console.log("🏠 [CHAT] Salas recibidas:", res.salas);
                    // Obtener info de membresía para determinar si es admin de alguna sala
                    const adminSala = res.salas.find(s => s.esAdmin === 1);
                    const isUserAdmin = !!adminSala;
                    setUserIsAdminFlag(isUserAdmin);
                    if (isUserAdmin) localStorage.setItem("user-is-admin", "true");
                    // Filtrar sala de admins para no admins
                    const filtered = res.salas.filter(s => {
                        if (s.id === "sala-admins-global" && !isUserAdmin) return false;
                        return true;
                    });
                    filtered.forEach(s => addUserRoom(s));
                }
                loadedRef.current = true;
            });
        };

        socket.on("connect", loadInitialData);

        socket.on("Login Exitoso", (data) => {
            console.log("🔐 [CHAT] Login Exitoso:", data);
            setUserIsAdminFlag(!!data.isAdmin);
            localStorage.setItem("user-is-admin", data.isAdmin ? "true" : "false");
            if (data.isAdmin && data.user) {
                setAdminsList(prev => prev.includes(data.user) ? prev : [...prev, data.user]);
            }
        });

        const handleUsers = (data) => {
            console.log("👥 [CHAT] Users Actualizados:", data);
            const users = data.users || data;
            const admins = data.admins || [];
            const normalizedUsers = users.map(u => {
                if (typeof u === "string") return { nombre: u, avatar: null };
                return { nombre: u?.nombre || u, avatar: u?.avatar || null };
            });
            setConnectedUsers(normalizedUsers);
            setAdminsList(admins);
        };

        socket.on("Users Actualizados", handleUsers);

        return () => {
            socket.off("connect", loadInitialData);
            socket.off("Login Exitoso");
            socket.off("Users Actualizados", handleUsers);
            loadedRef.current = false;
        };
    }, [socket, user, setConnectedUsers, addUserRoom]);

    // Scroll al fondo cuando llega un mensaje nuevo
    useEffect(() => {
        if (!historialListo) return;
        const atBottom = isAtBottom;
        setTimeout(() => {
            if (atBottom) {
                const el = mensajesRef.current;
                if (el) el.scrollTop = el.scrollHeight;
                setShowScrollBtn(false);
            } else {
                setShowScrollBtn(true);
            }
        }, 0);
    }, [messages, historialListo]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll al fondo al cargar el historial por primera vez
    useEffect(() => {
        if (!historialListo) return;
        setTimeout(() => {
            const el = mensajesRef.current;
            if (el) el.scrollTop = el.scrollHeight;
        }, 50);
    }, [historialListo]);

    // Fijar altura para evitar problemas con teclado en mobile
    useEffect(() => {
        const setHeight = () => {
            const vh = window.visualViewport?.height || window.innerHeight;
            document.documentElement.style.setProperty("--app-height", `${vh}px`);
        };
        setHeight();
        window.addEventListener("resize", setHeight);
        window.addEventListener("orientationchange", () => setTimeout(setHeight, 100));
        if (window.visualViewport) window.visualViewport.addEventListener("resize", setHeight);
        return () => {
            window.removeEventListener("resize", setHeight);
            if (window.visualViewport) window.visualViewport.removeEventListener("resize", setHeight);
        };
    }, []);

    const handleScroll = () => {
        const el = mensajesRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        setIsAtBottom(atBottom);
        if (atBottom) setShowScrollBtn(false);
        setScrolled(el.scrollTop > 10);
        
        if (socket && messages.length > 0) {
            const visibleMessages = Array.from(el.querySelectorAll('[id^="msg-"]'));
            visibleMessages.forEach(msgEl => {
                const msgId = msgEl.id.replace('msg-', '');
                const msg = messages.find(m => m.id === msgId);
                if (msg && msg.user !== user) {
                    socket.emit("Mensaje Leído", { messageId: msgId });
                }
            });
        }
    };

    const handleLoadOlder = () => {
        const el = mensajesRef.current;
        if (!el) return;
        setLoadingOlder(true);
        const prevHeight = el.scrollHeight;
        loadOlder((msgs) => {
            prependMessages(msgs);
            setLoadingOlder(false);
            requestAnimationFrame(() => {
                el.scrollTop = el.scrollHeight - prevHeight;
            });
        });
    };

    const scrollToBottom = () => {
        const el = mensajesRef.current;
        if (el) el.scrollTop = el.scrollHeight;
        setShowScrollBtn(false);
        setUnreadCount(0);
    };

    return (
        <div
            className="flex flex-col w-full relative overflow-hidden"
            style={{ height: "var(--app-height, 100dvh)" }}
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between px-3 py-2 z-20 shrink-0 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm"
                        : "bg-transparent border-b border-transparent"
                }`}
                style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
            >
                {/* Logo + estado */}
                <div className="flex items-center gap-2">
                    <ProfileDropdown isAdmin={userIsAdminFlag || adminsList.includes(user)} socket={socket} />
                    <RoomSelector scrolled={scrolled} socket={socket} isUserAdmin={userIsAdminFlag} />
                </div>

                {/* Botones */}
                <div className="flex items-center gap-1.5">
                    <UsersPanel />
                    <VideoCall 
                        socket={socket} 
                        callTrigger={callTrigger}
                    />
                    <button 
                        onClick={() => setCallTrigger(t => t + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm hover:scale-105 transition cursor-pointer border ${getNavbarButtonStyle()}`}
                    >
                        📞
                    </button>
                    <button
                        onClick={() => setShowMusicApp(p => !p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm hover:scale-105 transition cursor-pointer border ${getNavbarButtonStyle()}`}
                    >
                        🎵
                    </button>
                    <button
                        onClick={() => setShowSettings(p => !p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm hover:scale-105 transition cursor-pointer border ${getNavbarButtonStyle()}`}
                    >
                        ⚙️
                    </button>
                    <ThemeSelector scrolled={scrolled} />
                </div>
            </div>

            {/* Mensajes */}
            <div
                ref={mensajesRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1"
                style={{ overscrollBehavior: "contain" }}
            >
                {!currentRoom && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <p className="text-white/70 text-lg">💬 Elegí una sala para empezar</p>
                        <p className="text-white/40 text-sm">Usá el selector de salas ↑</p>
                    </div>
                )}

                {currentRoom && !historialListo && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"/>
                        <p className="text-white/50 text-sm">Cargando mensajes...</p>
                    </div>
                )}

                {hasMore && (
                    <div className="flex justify-center py-2">
                        <button
                            onClick={handleLoadOlder}
                            disabled={loadingOlder}
                            className="text-sm bg-black/10 hover:bg-black/20 px-4 py-1.5 rounded-full transition disabled:opacity-50 cursor-pointer"
                        >
                            {loadingOlder ? "Cargando..." : "⬆️ Cargar mensajes anteriores"}
                        </button>
                    </div>
                )}

                {messages.map(msg => (
                    <Message
                        key={msg.id}
                        message={msg}
                        currentUser={user}
                        socket={socket}
                        onImageClick={setLightboxSrc}
                        onPlayMusic={() => {}}
                        userAvatar={msg.user === user ? avatar : (msg.senderAvatar || null)}
                        adminsList={adminsList}
                    />
                ))}

                {typingUsers.filter(u => u !== user).length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 w-fit">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"/>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"/>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"/>
                        </div>
                        <span className="text-xs text-gray-400 italic">
                            {typingUsers.filter(u => u !== user).join(", ")} está escribiendo
                        </span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="fixed bottom-24 right-4 bg-black/70 text-white text-sm px-4 py-2 rounded-full shadow-lg z-30 flex items-center gap-2 hover:bg-black/90 transition cursor-pointer"
                >
                    ⬇️ <span>Mensajes nuevos</span>
                </button>
            )}

            <MessageInput
                socket={socket}
                onType={onType}
                stopTyping={stopTyping}
                currentRoom={currentRoom}
            />

            <MusicApp
                socket={socket}
                currentUser={user}
                open={showMusicApp}
                onClose={() => setShowMusicApp(false)}
            />

            <Settings
                open={showSettings}
                onClose={() => setShowSettings(false)}
            />

            {lightboxSrc && (
                <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            )}
        </div>
    );
}