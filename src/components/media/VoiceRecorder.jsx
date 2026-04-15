// ============================================
// 🎤 VOICE RECORDER - Grabador de mensajes de voz
// Muestra waveform en tiempo real y timer estilo WhatsApp
// Archivo: src/components/media/VoiceRecorder.jsx
// ============================================

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Grabador de voz con visualización de waveform
 * @param {function} onSend - Callback para enviar audio
 * @param {function} onCancel - Callback para cancelar
 */
export default function VoiceRecorder({ onSend, onCancel }) {
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevels, setAudioLevels] = useState([]);
    const [audioBlob, setAudioBlob] = useState(null);
    
    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);

    // Funciones definidas antes del useEffect que las usa
    const cleanup = useCallback(() => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close();
}, []);

    // Iniciar grabación al montar
    useEffect(() => {
        startRecording();
        return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopRecording = () => {
        cleanup();
        setRecording(false);
    };

    const handleCancel = () => {
        cleanup();
        onCancel();
    };

    const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    // Estilos para el portal
    const styles = {
        container: {
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
        },
        cancelBtn: {
            background: "transparent", 
            border: "none", 
            cursor: "pointer", 
            fontSize: "1.5rem",
            color: "white"
        },
        waveform: {
            display: "flex", 
            alignItems: "center", 
            gap: "2px", 
            height: "30px",
            flex: 1
        },
        waveformBar: (level) => ({
            width: "3px",
            height: Math.max(4, level / 8),
            background: "#fff",
            borderRadius: "2px"
        }),
        timer: {
            color: "white", 
            fontWeight: "bold", 
            fontSize: "0.9rem", 
            minWidth: "45px"
        },
        sendBtn: {
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
        }
    };

    return createPortal(
        <div style={styles.container}>
            <button onClick={handleCancel} style={styles.cancelBtn}>
                ✕
            </button>
            
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={styles.waveform}>
                    {audioLevels.slice(-20).map((level, i) => (
                        <div key={i} style={styles.waveformBar(level)} />
                    ))}
                </div>
                <span style={styles.timer}>{fmt(recordingTime)}</span>
            </div>
            
            <button onClick={stopRecording} style={styles.sendBtn}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
            </button>
        </div>,
        document.body
    );
}

// ============================================
// 🎧 AUDIO PREVIEW - Preview del audio grabado
// Permite reproducir, enviar o cancelar
// ============================================

export function AudioPreview({ audioBlob, onSend, onCancel }) {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioBlob && audioRef.current) {
            const url = URL.createObjectURL(audioBlob);
            audioRef.current.src = url;
        }
    }, [audioBlob]);

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
            width: "320px"
        },
        title: {
            fontWeight: "bold", 
            textAlign: "center", 
            color: "#1f2937"
        },
        audio: { width: "100%" },
        buttons: {
            display: "flex", 
            gap: "0.75rem", 
            justifyContent: "center"
        },
        cancelBtn: {
            background: "#ef4444", 
            color: "white", 
            padding: "0.5rem 1rem", 
            borderRadius: "0.75rem", 
            fontWeight: "bold", 
            border: "none", 
            cursor: "pointer"
        },
        sendBtn: {
            background: "#22c55e", 
            color: "white", 
            padding: "0.5rem 1rem", 
            borderRadius: "0.75rem", 
            fontWeight: "bold", 
            border: "none", 
            cursor: "pointer"
        }
    };

    return createPortal(
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={styles.title}>🎙️ Audio grabado</h3>
                <audio ref={audioRef} controls style={styles.audio} />
                <div style={styles.buttons}>
                    <button onClick={onCancel} style={styles.cancelBtn}>❌ Cancelar</button>
                    <button onClick={onSend} style={styles.sendBtn}>✅ Enviar</button>
                </div>
            </div>
        </div>,
        document.body
    );
}