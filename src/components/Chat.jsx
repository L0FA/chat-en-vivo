import { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useSocket } from "../hooks/useSocket";
import { useMessages } from "../hooks/useMessages";
import { useTyping } from "../hooks/useTyping";
import Message from "./Message";
import MessageInput from "./MessageInput";
import ThemeSelector from "./ThemeSelector";
import RoomSelector from "./RoomSelector";
import UsersPanel from "./UsersPanel";
import Lightbox from "./Lightbox";
import MusicApp from "./MusicApp";
import VideoCall from "./VideoCall";
import ProfileDropdown from "./ProfileDropdown";

export default function Chat() {
    const { user, password, avatar, messages, prependMessages, typingUsers, lightboxSrc, setLightboxSrc, currentRoom, connectedUsers, setConnectedUsers } = useChat();
    const { socket, isAdmin: userIsAdmin } = useSocket(user, password);
    
    const { historialListo, hasMore, loadOlder } = useMessages(socket, currentRoom);
    const { onType, stopTyping } = useTyping(socket);
    const [scrolled, setScrolled] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const mensajesRef = useRef(null);
    const bottomRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [showMusicApp, setShowMusicApp] = useState(false);
    const [callTrigger, setCallTrigger] = useState(0);

    // Efecto para actualizar título con notificaciones
    useEffect(() => {
        if (unreadCount > 0) {
            document.title = `💬 (${unreadCount}) WhatsAppn't`;
        } else {
            document.title = "💬 WhatsAppn't";
        }
    }, [unreadCount]);

    // Efecto para contar mensajes no leídos
    useEffect(() => {
        if (!socket || !historialListo) return;
        
        const playNotificationSound = () => {
            const notificationSound = localStorage.getItem("notification-sound") || "default";
            if (notificationSound === "none") return;
            
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === "suspended") {
                    audioCtx.resume();
                }
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                if (notificationSound === "ding") {
                    oscillator.frequency.value = 800;
                    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.3);
                } else if (notificationSound === "chime") {
                    oscillator.frequency.value = 600;
                    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.15);
                    
                    const osc2 = audioCtx.createOscillator();
                    const gain2 = audioCtx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioCtx.destination);
                    osc2.frequency.value = 900;
                    gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.15);
                    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                    osc2.start(audioCtx.currentTime + 0.15);
                    osc2.stop(audioCtx.currentTime + 0.4);
                } else if (notificationSound === "pop") {
                    oscillator.frequency.value = 400;
                    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.1);
                } else {
                    // default
                    oscillator.frequency.value = 600;
                    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.2);
                }
            } catch { /* silence is golden */ }
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

    const [adminsList, setAdminsList] = useState(() => userIsAdmin ? [user] : []);

    // Escuchar usuarios conectados
    useEffect(() => {
        if (!socket) return;
        
        const handleUsers = ({ users, admins = [] }) => {
            console.log("📋 RAW usuarios recibidos:", JSON.stringify(users).slice(0, 200));
            
            // Normalizar usuarios - puede ser array de strings o de objetos
            const normalizedUsers = users.map(u => {
                if (typeof u === "string") return { nombre: u, avatar: null };
                return { nombre: u?.nombre || u, avatar: u?.avatar || null };
            });
            
            console.log("📋 Normalizado:", normalizedUsers.map(u => `${u.nombre.substring(0,10)}: avatar=${u.avatar ? "SÍ" : "NO"}`));
            setConnectedUsers(normalizedUsers);
            setAdminsList(admins);
        };
        
        socket.on("Usuarios Conectados", handleUsers);
        return () => socket.off("Usuarios Conectados", handleUsers);
    }, [socket, setConnectedUsers]);

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
            document.documentElement.style.setProperty(
                "--app-height",
                `${window.innerHeight}px`
            );
        };

        setHeight();
        window.addEventListener("resize", setHeight);
        window.addEventListener("orientationchange", () => setTimeout(setHeight, 100));
        return () => {
            window.removeEventListener("resize", setHeight);
        };
    }, []);

    const handleScroll = () => {
        const el = mensajesRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        setIsAtBottom(atBottom);
        if (atBottom) setShowScrollBtn(false);
        setScrolled(el.scrollTop > 10);
        
        // Marcar mensajes como leídos cuando se ven
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
                    <ProfileDropdown isAdmin={adminsList.includes(user)} socket={socket} />
                    <RoomSelector scrolled={scrolled} socket={socket} />
                </div>

                {/* Botones */}
                <div className="flex items-center gap-1.5">
                    <UsersPanel />
                    <button 
                        onClick={() => setCallTrigger(t => t + 1)} 
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm hover:scale-105 transition cursor-pointer border ${
                            scrolled
                                ? "bg-white/90 border-gray-200"
                                : "bg-white/20 border-white/30 backdrop-blur-sm"
                        }`}
                    >
                        📞
                    </button>
                    <button
                        onClick={() => setShowMusicApp(p => !p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm hover:scale-105 transition cursor-pointer border ${
                            scrolled
                                ? "bg-white/90 border-gray-200"
                                : "bg-white/20 border-white/30 backdrop-blur-sm"
                        }`}
                    >
                        🎵
                    </button>
                    <ThemeSelector scrolled={scrolled} />
                </div>
            </div>

            {/* VideoCall - montado para recibir eventos */}
            <VideoCall 
                socket={socket} 
                currentRoom={currentRoom} 
                externalTrigger={callTrigger}
            />

            {/* Mensajes */}
            <div
                ref={mensajesRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1"
                style={{ overscrollBehavior: "contain" }}
            >
                {/* Cargando mensajes */}
                {!historialListo && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"/>
                        <p className="text-white/50 text-sm">Cargando mensajes...</p>
                    </div>
                )}

                {/* Cargar anteriores */}
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

                {/* Lista de mensajes */}
                {messages.map(msg => {
                    // Obtener avatar del usuario que envió el mensaje
                    const senderUser = connectedUsers.find(u => u.nombre === msg.user);
                    const senderAvatar = senderUser?.avatar || null;
                    
                    return (
                    <Message
                        key={msg.id}
                        message={msg}
                        currentUser={user}
                        socket={socket}
                        onImageClick={setLightboxSrc}
                        onPlayMusic={() => {}}
                        userAvatar={msg.user === user ? avatar : senderAvatar}
                        adminsList={adminsList}
                    />
                );})}

                {/* Indicador de escritura */}
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

            {/* Botón scroll al fondo */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="fixed bottom-24 right-4 bg-black/70 text-white text-sm px-4 py-2 rounded-full shadow-lg z-30 flex items-center gap-2 hover:bg-black/90 transition cursor-pointer"
                >
                    ⬇️ <span>Mensajes nuevos</span>
                </button>
            )}

            {/* Input */}
            <MessageInput
                socket={socket}
                onType={onType}
                stopTyping={stopTyping}
                currentRoom={currentRoom}
            />

            {/* Music App */}
            <MusicApp
                socket={socket}
                currentUser={user}
                open={showMusicApp}
                onClose={() => setShowMusicApp(false)}
            />

            {/* Lightbox */}
            {lightboxSrc && (
                <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            )}
        </div>
    );
}