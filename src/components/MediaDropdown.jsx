// ============================================
// 📎 MEDIA DROPDOWN - Menú de subir media
// Opciones: Subir archivo, cámara, mensaje de voz
// Archivo: src/components/MediaDropdown.jsx
// ============================================

import { useState, useRef, useCallback } from "react";
import { VoiceRecorder, AudioPreview, Camera, MediaPreview } from "./media";

/**
 * Componente dropdown para seleccionar tipo de media
 * @param {Object} props
 * @param {Object} props.socket - Socket de conexión
 * @param {string} props.currentRoom - Sala actual
 */
export default function MediaDropdown({ socket, currentRoom }) {
    // Estados del dropdown
    const [open, setOpen] = useState(false);
    
    // Estados de modales
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showAudioPreview, setShowAudioPreview] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);

    // Referencias
    const fileInputRef = useRef(null);

    // ============================================
    // 📁 SUBIR ARCHIVO
    // ============================================

    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file || !socket) return;
        
        const type = file.type.startsWith("video/") ? "video" : "image";
        const reader = new FileReader();
        reader.onload = (ev) => {
            socket.emit(type === "image" ? "Imagen en Chat" : "Video en Chat", {
                data: ev.target.result,
                timestamp: Date.now(),
                room: currentRoom
            });
        };
        reader.readAsDataURL(file);
        e.target.value = "";
        setOpen(false);
    }, [socket, currentRoom]);

    // ============================================
    // 🎤 VOICE RECORDER
    // ============================================

    const startVoice = useCallback(() => {
        setOpen(false);
        setShowVoiceRecorder(true);
    }, []);

    const handleVoiceSend = useCallback((dataUrl) => {
        setShowVoiceRecorder(false);
        setShowAudioPreview(false);
        setAudioBlob(null);
        socket?.emit("Audio en Chat", { data: dataUrl, timestamp: Date.now(), room: currentRoom });
    }, [socket, currentRoom]);

    const handleVoiceCancel = useCallback(() => {
        setShowVoiceRecorder(false);
        setShowAudioPreview(false);
        setAudioBlob(null);
    }, []);

    // Audio preview callback (cuando se termina de grabar)
    const handleAudioReady = useCallback((blob) => {
        setShowVoiceRecorder(false);
        setAudioBlob(blob);
        setShowAudioPreview(true);
    }, []);

    // ============================================
    // 📷 CÁMARA
    // ============================================

    const openCamera = useCallback(() => {
        setOpen(false);
        setShowCamera(true);
    }, []);

    const handleCapture = useCallback((media) => {
        setShowCamera(false);
        setMediaPreview(media);
    }, []);

    const handleCameraClose = useCallback(() => {
        setShowCamera(false);
    }, []);

    // ============================================
    // 🖼️ MEDIA PREVIEW (enviar media capturada)
    // ============================================

    const sendMedia = useCallback((media) => {
        if (!socket || !currentRoom) return;
        
        if (media.type === "video" && media.blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
                socket.emit("Video en Chat", { data: e.target.result, timestamp: Date.now(), room: currentRoom });
            };
            reader.readAsDataURL(media.blob);
        } else {
            socket.emit("Imagen en Chat", { data: media.src, timestamp: Date.now(), room: currentRoom });
        }
        setMediaPreview(null);
    }, [socket, currentRoom]);

    const cancelMedia = useCallback(() => {
        setMediaPreview(null);
    }, []);

    // ============================================
    // 🎨 RENDER
    // ============================================

    return (
        <>
            {/* Botón principal */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center text-lg hover:bg-white/20 hover:scale-105 transition shrink-0 text-white cursor-pointer shadow-lg"
                >
                    📷
                </button>

                {/* Dropdown */}
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <div className="absolute bottom-12 right-0 bg-gray-900/95 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl z-50 min-w-44 border border-white/20">
                            <button
                                onClick={() => { fileInputRef.current?.click(); setOpen(false); }}
                                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition flex items-center gap-3 cursor-pointer border-b border-white/10"
                            >
                                <span className="text-lg">🖼️</span> Subir media
                            </button>
                            <button
                                onClick={openCamera}
                                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition flex items-center gap-3 cursor-pointer border-b border-white/10"
                            >
                                <span className="text-lg">📷</span> Usar cámara
                            </button>
                            <button
                                onClick={startVoice}
                                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition flex items-center gap-3 cursor-pointer"
                            >
                                <span className="text-lg">🎤</span> Mensaje de voz
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Input file oculto */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Voice Recorder */}
            {showVoiceRecorder && (
                <VoiceRecorderWrapper 
                    onSend={handleVoiceSend}
                    onCancel={handleVoiceCancel}
                    onAudioReady={handleAudioReady}
                />
            )}

            {/* Audio Preview */}
            {showAudioPreview && audioBlob && (
                <AudioPreview 
                    audioBlob={audioBlob}
                    onSend={(dataUrl) => {
        socket?.emit("Audio en Chat", { data: dataUrl, timestamp: Date.now(), room: currentRoom });
                        setShowAudioPreview(false);
                        setAudioBlob(null);
                    }}
                    onCancel={() => {
                        setShowAudioPreview(false);
                        setAudioBlob(null);
                    }}
                />
            )}

            {/* Cámara */}
            {showCamera && (
                <Camera 
                    onCapture={handleCapture}
                    onClose={handleCameraClose}
                />
            )}

            {/* Media Preview */}
            {mediaPreview && (
                <MediaPreview 
                    media={mediaPreview}
                    onSend={sendMedia}
                    onCancel={cancelMedia}
                />
            )}
        </>
    );
}

// ============================================
// 🎤 VOICE RECORDER WRAPPER - Wrapper que maneja el blob
// ============================================

function VoiceRecorderWrapper({ onSend, onCancel }) {
    const handleSend = (dataUrl) => {
        onSend(dataUrl);
    };

    // El componente interno maneja todo, simplemente lo renderizamos
    return <VoiceRecorder onSend={handleSend} onCancel={onCancel} />;
}