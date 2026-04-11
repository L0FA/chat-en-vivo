import { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useSocket } from "../hooks/useSocket";
import { useMessages } from "../hooks/useMessages";
import { useTyping } from "../hooks/useTyping";
import Message from "./Message";
import MessageInput from "./MessageInput";
import ThemeSelector from "./ThemeSelector";
import UsersPanel from "./UsersPanel";
import Lightbox from "./Lightbox";
import MusicApp from "./MusicApp";
import VideoCall, { CallButton } from "./VideoCall";

export default function Chat() {
    const { user, messages, prependMessages, typingUsers, lightboxSrc, setLightboxSrc } = useChat();
    const { socket, connected } = useSocket(user);
    const { historialListo, hasMore, loadOlder } = useMessages(socket);
    const { onType, stopTyping } = useTyping(socket);
    const [scrolled, setScrolled] = useState(false);

    const mensajesRef = useRef(null);
    const bottomRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [showMusicApp, setShowMusicApp] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);

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
        const initialHeight = window.innerHeight;
        document.documentElement.style.setProperty("--app-height", `${initialHeight}px`);

        const handleResize = () => {
            if (window.innerHeight > initialHeight * 0.75) {
                document.documentElement.style.setProperty(
                    "--app-height",
                    `${window.innerHeight}px`
                );
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleScroll = () => {
        const el = mensajesRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        setIsAtBottom(atBottom);
        if (atBottom) setShowScrollBtn(false);
        setScrolled(el.scrollTop > 10);
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
                    <span className="text-xl">💬</span>
                    <div>
                        <h1 className={`font-bold text-sm leading-tight transition-colors duration-300 ${scrolled ? "text-gray-800" : "text-white drop-shadow"}`}>
                            Whatsappn't
                        </h1>
                        <p className={`text-xs transition-colors duration-300 ${scrolled ? "text-gray-400" : "text-white/70 drop-shadow"}`}>
                            {connected ? "🟢 Conectado" : "🔴 Desconectado"}
                        </p>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex items-center gap-1.5">
                    <UsersPanel />
                    <CallButton socket={socket} currentUser={user} />
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

            {/* Mensajes */}
            <div
                ref={mensajesRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1"
                style={{ overscrollBehavior: "contain" }}
            >
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
                {messages.map(msg => (
                    <Message
                        key={msg.id}
                        message={msg}
                        currentUser={user}
                        socket={socket}
                        onImageClick={setLightboxSrc}
                        onPlayMusic={() => {}}
                    />
                ))}

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
            />

            {/* Music App */}
            <MusicApp
                socket={socket}
                currentUser={user}
                open={showMusicApp}
                onClose={() => setShowMusicApp(false)}
            />

            {/* Video Call */}
            {showVideoCall && (
                <VideoCall
                    socket={socket}
                    onClose={() => setShowVideoCall(false)}
                />
            )}

            {/* Lightbox */}
            {lightboxSrc && (
                <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            )}
        </div>
    );
}