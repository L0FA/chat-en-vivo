import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

export default function MediaDropdown({ socket }) {
    const [open, setOpen] = useState(false);
    const [recording, setRecording] = useState(false);
    const [videoRecording, setVideoRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [showAudioPreview, setShowAudioPreview] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [showCamera, setShowCamera] = useState(false);

    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const videoChunksRef = useRef([]);
    const streamRef = useRef(null);
    const videoRef = useRef(null);
    const audioPreviewRef = useRef(null);

    // ---- Asignar stream al video cuando se monta la cámara ----
    useEffect(() => {
        if (showCamera && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [showCamera]);

    // Asignar src al audio preview cuando se muestra
    useEffect(() => {
        if (showAudioPreview && audioBlob && audioPreviewRef.current) {
            audioPreviewRef.current.src = URL.createObjectURL(audioBlob);
        }
    }, [showAudioPreview, audioBlob]);

    // ---- Subir archivo ----
    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file || !socket) return;
        const type = file.type.startsWith("video/") ? "video" : "image";
        const reader = new FileReader();
        reader.onload = (ev) => {
            socket.emit(type === "image" ? "Imagen en Chat" : "Video en Chat", {
                data: ev.target.result,
                timestamp: Date.now()
            });
        };
        reader.readAsDataURL(file);
        e.target.value = "";
        setOpen(false);
    }, [socket]);

    // ---- Voz ----
    const startVoice = useCallback(async () => {
        setOpen(false);
        console.log("🎤 Iniciando grabación...");
        try {
            console.log("🎤 Pidiendo permisos de audio...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("🎤 Permisos obtenidos, stream:", stream.id);
            streamRef.current = stream;
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                setShowAudioPreview(true);
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecording(true);
        } catch (err) {
            console.error("Error micrófono:", err);
            alert("No se pudo acceder al micrófono");
        }
    }, []);

    const stopVoice = useCallback(() => {
        mediaRecorderRef.current?.stop();
        streamRef.current?.getTracks().forEach(t => t.stop());
        setRecording(false);
    }, []);

    const sendAudio = useCallback(() => {
        if (!audioBlob || !socket) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit("Audio en Chat", { data: e.target.result, timestamp: Date.now() });
        };
        reader.readAsDataURL(audioBlob);
        setShowAudioPreview(false);
        setAudioBlob(null);
    }, [audioBlob, socket]);

    const cancelAudio = useCallback(() => {
        setShowAudioPreview(false);
        setAudioBlob(null);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // ---- Cámara ----
    const openCamera = useCallback(async () => {
        setOpen(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" },
                audio: false 
            });
            streamRef.current = stream;
            setShowCamera(true);
        } catch (err) {
            console.error("Error cámara:", err);
            alert("No se pudo acceder a la cámara. Verificá los permisos.");
        }
    }, []);

    const takePhoto = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext("2d").drawImage(video, 0, 0);
        const src = canvas.toDataURL("image/jpeg");
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setShowCamera(false);
        setMediaPreview({ src, type: "image" });
    }, []);

    const startVideoRecording = useCallback(() => {
        if (!streamRef.current) return;
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
            ? "video/webm;codecs=vp8"
            : "video/webm";
        const recorder = new MediaRecorder(streamRef.current, { mimeType });
        videoChunksRef.current = [];
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) videoChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(videoChunksRef.current, { type: mimeType });
            const src = URL.createObjectURL(blob);
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            setShowCamera(false);
            setVideoRecording(false);
            setMediaPreview({ src, type: "video", blob });
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setVideoRecording(true);
    }, []);

    const stopVideoRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
    }, []);

    const closeCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setShowCamera(false);
        setVideoRecording(false);
    }, []);

    return (
        <>
            {/* Botón principal */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="w-9 h-9 rounded-full bg-blue-400 flex items-center justify-center text-lg hover:scale-110 transition shrink-0 text-white cursor-pointer"
                >
                    📎
                </button>

                {/* Dropdown */}
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <div className="absolute bottom-12 right-0 bg-[#222] rounded-xl overflow-hidden shadow-2xl z-50 min-w-40 border border-white/10">
                            <button
                                onClick={() => { fileInputRef.current?.click(); setOpen(false); }}
                                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition flex items-center gap-2 cursor-pointer"
                            >
                                🖼️ Subir media
                            </button>
                            <button
                                onClick={openCamera}
                                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition flex items-center gap-2 cursor-pointer"
                            >
                                📷 Usar cámara
                            </button>
                            <button
                                onClick={startVoice}
                                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition flex items-center gap-2 cursor-pointer"
                            >
                                🎤 Mensaje de voz
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

            {/* Grabando voz */}
            {recording && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-3 shadow-xl z-50">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse"/>
                    <span className="text-sm font-bold">Grabando...</span>
                    <button
                        onClick={stopVoice}
                        className="bg-white text-red-500 text-xs font-bold px-3 py-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
                    >
                        ⏹ Detener
                    </button>
                </div>
            )}

            {/* Preview audio */}
            {showAudioPreview && createPortal(
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999 }}>
                    <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", width: "320px" }}>
                        <h3 style={{ fontWeight: "bold", textAlign: "center", color: "#1f2937" }}>🎙️ Audio grabado</h3>
                        <audio ref={audioPreviewRef} controls style={{ width: "100%" }}/>
                        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                            <button onClick={cancelAudio} style={{ background: "#ef4444", color: "white", padding: "0.5rem 1rem", borderRadius: "0.75rem", fontWeight: "bold", border: "none", cursor: "pointer" }}>❌ Cancelar</button>
                            <button onClick={sendAudio} style={{ background: "#22c55e", color: "white", padding: "0.5rem 1rem", borderRadius: "0.75rem", fontWeight: "bold", border: "none", cursor: "pointer" }}>✅ Enviar</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Cámara */}
            {showCamera && createPortal(
                <div style={{ position: "fixed", inset: 0, background: "black", zIndex: 999999, display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        />
                    </div>
                    {videoRecording && (
                        <div style={{ position: "absolute", top: "1rem", left: "50%", transform: "translateX(-50%)", background: "#ef4444", color: "white", padding: "0.4rem 1rem", borderRadius: "999px", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: "bold" }}>
                            <span style={{ width: "8px", height: "8px", background: "white", borderRadius: "50%", animation: "pulse 1s infinite" }}/>
                            Grabando video...
                        </div>
                    )}
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", padding: "1.5rem", background: "rgba(0,0,0,0.7)", flexShrink: 0, flexWrap: "wrap" }}>
                        <button
                            onClick={takePhoto}
                            disabled={videoRecording}
                            style={{ background: videoRecording ? "#9ca3af" : "#60a5fa", color: "white", padding: "0.75rem 2rem", borderRadius: "999px", fontWeight: "bold", border: "none", cursor: videoRecording ? "not-allowed" : "pointer", fontSize: "1rem" }}
                        >
                            📸 Tomar foto
                        </button>
                        <button
                            onClick={videoRecording ? stopVideoRecording : startVideoRecording}
                            style={{ background: videoRecording ? "#ef4444" : "#a855f7", color: "white", padding: "0.75rem 2rem", borderRadius: "999px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "1rem" }}
                        >
                            {videoRecording ? "⏹ Detener video" : "📹 Grabar video"}
                        </button>
                        <button
                            onClick={closeCamera}
                            disabled={videoRecording}
                            style={{ background: videoRecording ? "#9ca3af" : "#4b5563", color: "white", padding: "0.75rem 2rem", borderRadius: "999px", fontWeight: "bold", border: "none", cursor: videoRecording ? "not-allowed" : "pointer", fontSize: "1rem" }}
                        >
                            ✖ Cerrar
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Preview foto/video */}
            {mediaPreview && createPortal(
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999 }}>
                    <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "380px", width: "100%", margin: "0 1rem" }}>
                        <h3 style={{ fontWeight: "bold", textAlign: "center", color: "#1f2937" }}>
                            {mediaPreview.type === "video" ? "📹 Video capturado" : "📷 Foto capturada"}
                        </h3>
                        {mediaPreview.type === "video" ? (
                            <video src={mediaPreview.src} controls style={{ width: "100%", maxHeight: "320px", borderRadius: "0.75rem" }}/>
                        ) : (
                            <img src={mediaPreview.src} style={{ width: "100%", maxHeight: "320px", objectFit: "contain", borderRadius: "0.75rem" }} alt="preview"/>
                        )}
                        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                            <button
                                onClick={() => setMediaPreview(null)}
                                style={{ background: "#ef4444", color: "white", padding: "0.5rem 1rem", borderRadius: "0.75rem", fontWeight: "bold", border: "none", cursor: "pointer" }}
                            >
                                ❌ Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (!mediaPreview || !socket) return;
                                    if (mediaPreview.type === "video" && mediaPreview.blob) {
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            socket.emit("Video en Chat", { data: e.target.result, timestamp: Date.now() });
                                        };
                                        reader.readAsDataURL(mediaPreview.blob);
                                    } else {
                                        socket.emit("Imagen en Chat", { data: mediaPreview.src, timestamp: Date.now() });
                                    }
                                    setMediaPreview(null);
                                }}
                                style={{ background: "#22c55e", color: "white", padding: "0.5rem 1rem", borderRadius: "0.75rem", fontWeight: "bold", border: "none", cursor: "pointer" }}
                            >
                                ✅ Enviar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}