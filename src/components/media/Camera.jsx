// ============================================
// 📷 CAMERA COMPONENT - Cámara para fotos y videos
// Permite tomar fotos, grabar videos y hacer preview
// Archivo: src/components/media/Camera.jsx
// ============================================

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Componente de cámara
 * @param {function} onCapture - Callback para enviar media (foto/video)
 * @param {function} onClose - Callback para cerrar cámara
 */
export default function Camera({ onCapture, onClose }) {
    const [videoRecording, setVideoRecording] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);
    
    const streamRef = useRef(null);
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const videoChunksRef = useRef([]);

    // Iniciar cámara al montar
    useEffect(() => {
        startCamera();
        return () => cleanup();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" },
                audio: true
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error cámara:", err);
            alert("No se pudo acceder a la cámara.");
            onClose();
        }
    };

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const takePhoto = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext("2d").drawImage(video, 0, 0);
        const src = canvas.toDataURL("image/jpeg");
        
        cleanup();
        onCapture({ src, type: "image" });
    }, [onCapture]);

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
            cleanup();
            onCapture({ src, type: "video", blob });
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setVideoRecording(true);
    }, [onCapture]);

    const stopVideoRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
        setVideoRecording(false);
    }, []);

    const styles = {
        container: {
            position: "fixed", 
            inset: 0, 
            background: "black", 
            zIndex: 999999, 
            display: "flex", 
            flexDirection: "column"
        },
        videoContainer: {
            flex: 1, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            overflow: "hidden"
        },
        video: {
            maxWidth: "100%", 
            maxHeight: "100%", 
            objectFit: "contain"
        },
        recordingBadge: {
            position: "absolute", 
            top: "1rem", 
            left: "50%", 
            transform: "translateX(-50%)", 
            background: "#ef4444", 
            color: "white", 
            padding: "0.4rem 1rem", 
            borderRadius: "999px", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem", 
            fontSize: "0.85rem", 
            fontWeight: "bold"
        },
        dot: {
            width: "8px", 
            height: "8px", 
            background: "white", 
            borderRadius: "50%", 
            animation: "pulse 1s infinite"
        },
        controls: {
            display: "flex", 
            gap: "1rem", 
            justifyContent: "center", 
            padding: "1.5rem", 
            background: "rgba(0,0,0,0.7)", 
            flexShrink: 0, 
            flexWrap: "wrap"
        },
        btn: (color, disabled) => ({
            background: disabled ? "#9ca3af" : color, 
            color: "white", 
            padding: "0.75rem 2rem", 
            borderRadius: "999px", 
            fontWeight: "bold", 
            border: "none", 
            cursor: disabled ? "not-allowed" : "pointer", 
            fontSize: "1rem"
        })
    };

    return createPortal(
        <div style={styles.container}>
            <div style={styles.videoContainer}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={styles.video}
                />
                {videoRecording && (
                    <div style={styles.recordingBadge}>
                        <span style={styles.dot}></span>
                        Grabando video...
                    </div>
                )}
            </div>
            
            <div style={styles.controls}>
                <button
                    onClick={takePhoto}
                    disabled={videoRecording}
                    style={styles.btn("#60a5fa", videoRecording)}
                >
                    📸 Tomar foto
                </button>
                <button
                    onClick={videoRecording ? stopVideoRecording : startVideoRecording}
                    style={styles.btn(videoRecording ? "#ef4444" : "#a855f7", false)}
                >
                    {videoRecording ? "⏹ Detener video" : "📹 Grabar video"}
                </button>
                <button
                    onClick={onClose}
                    disabled={videoRecording}
                    style={styles.btn("#4b5563", videoRecording)}
                >
                    ✖ Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

// ============================================
// 🖼️ MEDIA PREVIEW - Preview de foto/video capturado
// Permite enviar o cancelar
// ============================================

export function MediaPreview({ media, onSend, onCancel }) {
    const styles = {
        overlay: {
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.8)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 999999
        },
        modal: {
            background: "white", 
            borderRadius: "1rem", 
            padding: "1.5rem", 
            display: "flex", 
            flexDirection: "column", 
            gap: "1rem", 
            maxWidth: "380px", 
            width: "100%", 
            margin: "0 1rem"
        },
        title: {
            fontWeight: "bold", 
            textAlign: "center", 
            color: "#1f2937"
        },
        media: {
            width: "100%", 
            maxHeight: "320px", 
            objectFit: "contain", 
            borderRadius: "0.75rem"
        },
        buttons: {
            display: "flex", 
            gap: "0.75rem", 
            justifyContent: "center"
        },
        btn: (color) => ({
            background: color, 
            color: "white", 
            padding: "0.5rem 1rem", 
            borderRadius: "0.75rem", 
            fontWeight: "bold", 
            border: "none", 
            cursor: "pointer"
        })
    };

    return createPortal(
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={styles.title}>
                    {media.type === "video" ? "📹 Video capturado" : "📷 Foto capturada"}
                </h3>
                {media.type === "video" ? (
                    <video src={media.src} controls style={styles.media} />
                ) : (
                    <img src={media.src} style={styles.media} alt="preview" />
                )}
                <div style={styles.buttons}>
                    <button onClick={onCancel} style={styles.btn("#ef4444")}>
                        ❌ Cancelar
                    </button>
                    <button onClick={() => onSend(media)} style={styles.btn("#22c55e")}>
                        ✅ Enviar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}