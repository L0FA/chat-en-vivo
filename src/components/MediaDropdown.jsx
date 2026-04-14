import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

export default function MediaDropdown({ socket }) {
    const [open, setOpen] = useState(false);
    const [recording, setRecording] = useState(false);
    const [videoRecording, setVideoRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [showAudioPreview, setShowAudioPreview] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevels, setAudioLevels] = useState([]);
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
        console.log("🎵 Audio preview effect:", { showAudioPreview, audioBlob: audioBlob?.type, audioBlobSize: audioBlob?.size });
        if (showAudioPreview && audioBlob) {
            setTimeout(() => {
                console.log("🎵 Asignando src al audio preview...");
                if (audioPreviewRef.current) {
                    const url = URL.createObjectURL(audioBlob);
                    console.log("🎵 URL creada:", url);
                    audioPreviewRef.current.src = url;
                } else {
                    console.log("🎵 audioPreviewRef.current es null");
                }
            }, 100);
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
    const recordingTimerRef = useRef(null);

    const startVoice = useCallback(async () => {
        setOpen(false);
        setRecordingTime(0);
        setAudioLevels([]);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true,
                video: false 
            });
            streamRef.current = stream;
            
            // Analizador simple para el waveform
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            
            const updateLevels = () => {
                if (!streamRef.current) return;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevels(prev => [...prev.slice(-30), avg]);
                if (streamRef.current) {
                    recordingTimerRef.current = requestAnimationFrame(updateLevels);
                }
            };
            
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                cancelAnimationFrame(recordingTimerRef.current);
                audioContext.close();
                const mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : 
                                 MediaRecorder.isTypeSupported("audio/3gpp") ? "audio/3gpp" : "audio/webm";
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                setShowAudioPreview(true);
            };
            recorder.start(100);
            mediaRecorderRef.current = recorder;
            setRecording(true);
            
            // Timer para el tiempo
            const timer = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            recordingTimerRef.current = timer;
            
            // Iniciar análisis de audio
            updateLevels();
        } catch (err) {
            console.error("Error micrófono:", err);
            alert("No se pudo acceder al micrófono: " + (err.message || err.name || "error desconocido"));
        }
    }, []);

    const stopVoice = useCallback(() => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
        }
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
            {recording && createPortal(
                <div style={{
                    position: "fixed", 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    background: "linear-gradient(to top, #128c7e, #075e54)",
                    padding: "20px 20px 40px 20px",
                    display: "flex", 
                    alignItems: "center", 
                    gap: "1rem",
                    zIndex: 999999
                }}>
                    <button
                        onClick={() => {
                            // Cancelar - no guardar
                            setRecording(false);
                            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                            streamRef.current?.getTracks().forEach(t => t.stop());
                        }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
                    >
                        ✕
                    </button>
                    
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {/* Waveform visual */}
                        <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "30px" }}>
                            {audioLevels.slice(-20).map((level, i) => (
                                <div 
                                    key={i}
                                    style={{
                                        width: "3px",
                                        height: Math.max(4, level / 8),
                                        background: "#fff",
                                        borderRadius: "2px"
                                    }}
                                />
                            ))}
                        </div>
                        
                        <span style={{ color: "white", fontWeight: "bold", fontSize: "0.9rem", minWidth: "45px" }}>
                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                        </span>
                    </div>
                    
                    <button
                        onClick={stopVoice}
                        style={{ 
                            background: "#25d366", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "50%", 
                            width: "50px", 
                            height: "50px",
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                        </svg>
                    </button>
                </div>,
                document.body
            )}

            {/* Preview audio */}
            {showAudioPreview && createPortal(
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999 }}>
                    <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", width: "320px" }}>
                        <h3 style={{ fontWeight: "bold", textAlign: "center", color: "#1f2937" }}>🎙️ Audio grabado</h3>
                        <audio 
                            ref={audioPreviewRef} 
                            controls 
                            style={{ width: "100%" }}
                            onError={() => console.error("🎵 Error en audio:", audioPreviewRef.current?.error)}
                            onLoadedMetadata={() => console.log("🎵 Audio loaded")}
                        />
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