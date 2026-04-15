// ============================================
// 📞 VIDEOCALL - Componente principal de llamadas
// orquestador de todos los subcomponentes de llamada
// Archivo: src/components/VideoCall.jsx
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWebRTC } from "../hooks/useWebRTC";
import { CallDropdown, IncomingCallModal, CallingScreen, ActiveCallPanel } from "./call";

/**
 * Componente principal de videollamada
 * Maneja el estado de la llamada y coordina subcomponentes
 * @param {Object} props
 * @param {Object} props.socket - Socket de conexión
 * @param {number} props.callTrigger - Trigger para mostrar dropdown
 */
export default function VideoCall({ socket, callTrigger = 0 }) {
    // El hook useChat ya no se usa directamente, los datos vienen por props
    // TODO: eliminar useChat si no se usa en otros lugares
    // const { user, connectedUsers } = useChat();
    
    // Estados de la llamada
    const [callState, setCallState] = useState("idle"); // idle | calling | active
    const [callType, setCallType] = useState("audio"); // audio | video
    const [remoteUser, setRemoteUser] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    
    // Estados de controles
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [showCallDropdown, setShowCallDropdown] = useState(false);
    const [remoteHasVideo, setRemoteHasVideo] = useState(false);
    
    // Estados de UI
    const [callPosition, setCallPosition] = useState({ x: 4, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Referencias a elementos del DOM y streams
    const ringtoneRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const timerRef = useRef(null);

    // ============================================
    // 📡 USEWEBRTC HOOK - Lógica de WebRTC (declarada primero)
    // ============================================

    const { peerConnection, createPeerConnection, addIceCandidate, setRemoteDescription } = useWebRTC({
        socket,
        localStream: localStreamRef,
        onRemoteStream: (stream) => {
            const hasVideo = stream.getVideoTracks().length > 0;
            setRemoteHasVideo(hasVideo);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play().then(() => console.log("🔊 Audio playing")).catch(e => console.log("🔇 Audio error:", e));
            }
        },
        onConnectionStateChange: (state) => {
            if (state === "disconnected" || state === "failed" || state === "closed") {
                console.log("🔗 Call ended");
                endCallCleanup();
            }
        }
    });

    // ============================================
    // 🔧 HELPERS - Funciones utilitarias
    // ============================================

    // Reproducir ringtone
    const playRingtone = useCallback(() => {
        const ringtoneUrl = localStorage.getItem("ringtone-url") || "https://www.soundjay.com/phone/cell-phone-ringing-01.mp3";
        if (ringtoneRef.current) {
            ringtoneRef.current.src = ringtoneUrl;
            ringtoneRef.current.play().catch(() => {});
        }
    }, []);

    // Detener ringtone
    const stopRingtone = useCallback(() => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    }, []);

    // Obtener stream local (cámara/mic)
    const startLocalStream = useCallback(async (video) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: video
            });
            console.log("🎤 getUserMedia OK, tracks:", stream.getTracks().map(t => t.kind + ":" + t.enabled));
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error("❌ Error getUserMedia:", err);
            return null;
        }
    }, []);

    // Limpiar al terminar llamada
    const endCallCleanup = useCallback(() => {
        stopRingtone();
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setCallState("idle");
        setRemoteUser(null);
        setIncomingCall(null);
        setCallDuration(0);
        setRemoteHasVideo(false);
    }, [stopRingtone]);

    // Timer de duración
    const startTimer = useCallback(() => {
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }, []);

    // ============================================
    // 🎮 CONTROLES DE LLAMADA
    // ============================================

    // Toggle mute
    const toggleMute = useCallback(() => {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
            socket?.emit("call:status", { muted: !track.enabled });
        }
}, [socket]);

    // Toggle video
    const toggleVideo = useCallback(async () => {
        if (isVideoOff) {
            const stream = await startLocalStream(true);
            if (stream) {
                const videoTrack = stream.getVideoTracks()[0];
                const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === "video");
                if (sender && videoTrack) sender.replaceTrack(videoTrack);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                setIsVideoOff(false);
            }
        } else {
            const videoTrack = localStreamRef.current?.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = false;
                setIsVideoOff(true);
            }
        }
    }, [isVideoOff, startLocalStream, peerConnection]);

    // ============================================
    // 🖥️ UI HELPERS - Drag, fullscreen, screen share
    // ============================================

    const handleDragStart = () => setIsDragging(true);
    
    const handleDrag = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = ((window.innerWidth - clientX - 192) / window.innerWidth) * 100;
        setCallPosition({ x: Math.max(0, Math.min(80, x)), y: 20 });
    };
    
    const handleDragEnd = () => setIsDragging(false);

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    // Toggle screen share - necesita peerConnection que ya está definido
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }
            setIsScreenSharing(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = stream;
                const track = stream.getVideoTracks()[0];
                const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === "video");
                if (sender && track) sender.replaceTrack(track);
                track.onended = () => toggleScreenShare();
                setIsScreenSharing(true);
            } catch (err) {
                console.error("Error screen share:", err);
            }
        }
    }, [isScreenSharing, peerConnection]);

    // ============================================
    // 📱 INICIAR LLAMADA - Outgoing call
    // ============================================

    const initiateCall = useCallback((targetUser, type) => {
        console.log("📞 Initiating call to:", targetUser, "type:", type);
        setShowCallDropdown(false);
        setCallType(type);
        setCallState("calling");
        
        startLocalStream(type === "video").then(stream => {
            if (stream) {
                console.log("🎤 Stream creado (initiate)");
                setRemoteUser(targetUser);
                
                // Crear peer connection
                const pc = createPeerConnection(targetUser);
                
                // Crear y enviar offer
                pc.createOffer().then(offer => {
                    pc.setLocalDescription(offer);
                    socket?.emit("webrtc:offer", { offer, target: targetUser });
                });
                
                setCallState("active");
                startTimer();
                
                // Notificar al usuario
                socket?.emit("call:invite", { to: targetUser, type });
            }
        });
    }, [socket, createPeerConnection, startLocalStream, startTimer]);

    // ============================================
    // ✅ ACEPTAR LLAMADA - Incoming call accept
    // ============================================

    const acceptCall = useCallback(async () => {
        console.log("📞 ACEPTANDO LLAMADA...");
        if (!incomingCall) return;
        
        const { from, type } = incomingCall;
        setIncomingCall(null);
        stopRingtone();
        
        socket?.emit("call:accept", { to: from });
        setCallType(type);
        setRemoteUser(from);
        
        startLocalStream(type === "video").then(async stream => {
            if (!stream) return;

            setCallState("active");
            
            const pc = createPeerConnection(from);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit("webrtc:offer", { offer, target: from });
            
            startTimer();
        });
    }, [incomingCall, socket, createPeerConnection, startLocalStream, startTimer, stopRingtone]);

    // ============================================
    // ❌ RECHAZAR LLAMADA - Incoming call reject
    // ============================================

    const rejectCall = useCallback(() => {
        if (incomingCall) {
            socket?.emit("call:reject", { to: incomingCall.from });
        }
        setIncomingCall(null);
        stopRingtone();
    }, [incomingCall, socket, stopRingtone]);

    // ============================================
    // 📡 SOCKET LISTENERS - Eventos del servidor
    // ============================================

    useEffect(() => {
        if (!socket) return;

        // Llamada entrante
        socket.on("call:invite", ({ from, type }) => {
            console.log("📞 Invited to call by:", from, "type:", type);
            setIncomingCall({ from, type });
            playRingtone();
        });

        // Usuario abandonó la llamada
        socket.on("call:leave", ({ user: leaver }) => {
            console.log("📞 User left call:", leaver);
            if (leaver === remoteUser) {
                setRemoteHasVideo(false);
                if (callState === "active") {
                    console.log("📞 La otra persona abandonó, terminando llamada");
                    socket?.emit("call:end", {});
                    endCallCleanup();
                }
            }
        });

        // Llamada terminada por servidor
        socket.on("call:end", () => {
            console.log("📞 Llamada terminada por el servidor");
            endCallCleanup();
        });

        // Llamada rechazada
        socket.on("call:rejected", ({ from }) => {
            console.log("📞 Call rejected by:", from);
            endCallCleanup();
            stopRingtone();
        });

        // Offer recibido (respuesta a nuestra oferta o nueva oferta)
        socket.on("webrtc:offer", async ({ offer, from }) => {
            console.log("📞 Received offer from:", from);
            setRemoteUser(from);
            
            const stream = await startLocalStream(callType === "video");
            if (!stream) return;

            setCallState("active");
            
            const pc = createPeerConnection(from);
            await setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("webrtc:answer", { answer, target: from });
            
            startTimer();
        });

        // Answer recibido
        socket.on("webrtc:answer", async ({ answer }) => {
            console.log("📞 Received answer");
            await setRemoteDescription(answer);
        });

        // ICE candidate recibido
        socket.on("webrtc:ice", ({ candidate }) => {
            addIceCandidate(candidate);
        });

        return () => {
            socket.off("call:invite");
            socket.off("call:leave");
            socket.off("call:end");
            socket.off("call:rejected");
            socket.off("webrtc:offer");
            socket.off("webrtc:answer");
            socket.off("webrtc:ice");
        };
    }, [socket, callType, remoteUser, callState, createPeerConnection, setRemoteDescription, addIceCandidate, startLocalStream, startTimer, endCallCleanup, stopRingtone, playRingtone]);

    // Mostrar dropdown al hacer trigger
    useEffect(() => {
        if (callTrigger > 0) {
            setTimeout(() => setShowCallDropdown(true), 0);
        }
    }, [callTrigger]);

    // ============================================
    // 🎨 RENDER - Renderizado de componentes
    // ============================================

    return createPortal(
        <>
            {/* Dropdown para seleccionar usuario */}
            <CallDropdown 
                show={callState === "idle" && showCallDropdown}
                onClose={() => setShowCallDropdown(false)}
                onCall={initiateCall}
            />

            {/* Modal de llamada entrante */}
            <IncomingCallModal 
                incomingCall={incomingCall}
                onAccept={acceptCall}
                onReject={rejectCall}
                ringtoneRef={ringtoneRef}
            />

            {/* Pantalla de conectando */}
            {callState === "calling" && (
                <CallingScreen 
                    onCancel={endCall}
                />
            )}

            {/* Panel de llamada activa */}
            {callState === "active" && (
                <ActiveCallPanel
                    remoteUser={remoteUser}
                    callType={callType}
                    callDuration={callDuration}
                    isFullscreen={isFullscreen}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    isScreenSharing={isScreenSharing}
                    isDragging={isDragging}
                    position={callPosition}
                    remoteVideoRef={remoteVideoRef}
                    localVideoRef={localVideoRef}
                    remoteHasVideo={remoteHasVideo}
                    onToggleMute={toggleMute}
                    onToggleVideo={toggleVideo}
                    onEndCall={endCall}
                    onToggleFullscreen={toggleFullscreen}
                    onToggleScreenShare={toggleScreenShare}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                />
            )}

            {/* Audio remoto (hidden) */}
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden"/>
        </>,
        document.body
    );
}