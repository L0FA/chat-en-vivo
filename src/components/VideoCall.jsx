import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useChat } from "../hooks/useChat";

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
];

export default function VideoCall({ socket }) {
    const [callState, setCallState] = useState("idle");
    const [callType, setCallType] = useState("audio");
    const [remoteUser, setRemoteUser] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [incomingCall, setIncomingCall] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const timerRef = useRef(null);
    const remoteUserRef = useRef(null);

    // Mantener remoteUser en ref para acceder en callbacks
    useEffect(() => { remoteUserRef.current = remoteUser; }, [remoteUser]);

    const startTimer = () => {
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    };

    const stopTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setCallDuration(0);
    };

    const stopLocalStream = () => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
    };

    const closePeer = () => {
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
    };

    const startLocalStream = useCallback(async (videoEnabled) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: videoEnabled ? { facingMode: "user" } : false
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (err) {
            console.error("Error accediendo a dispositivos:", err);
            alert("No se pudo acceder al micrófono/cámara");
            return null;
        }
    }, []);

    const createPeerConnection = useCallback((to) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionRef.current = pc;

        // Agregar tracks locales
        localStreamRef.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current);
        });

        // Recibir stream remoto
        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Enviar ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit("ICE Candidate", { candidate: event.candidate, to });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                handleEndCall();
            }
        };

        return pc;
          // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket]);

    const handleEndCall = useCallback(() => {
        stopLocalStream();
        closePeer();
        stopTimer();
        setCallState("idle");
        setRemoteUser(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setIsScreenSharing(false);
    }, []);

    const endCall = useCallback(() => {
        socket?.emit("Terminar Llamada", { from: remoteUserRef.current, to: remoteUserRef.current });
        handleEndCall();
    }, [socket, handleEndCall]);

    // ---- INICIAR LLAMADA (caller) ----
    // eslint-disable-next-line no-unused-vars
    const initiateCall = useCallback(async (to, type) => {
        setRemoteUser(to);
        setCallType(type);
        setCallState("calling");

        const videoEnabled = type === "video";
        const stream = await startLocalStream(videoEnabled);
        if (!stream) { setCallState("idle"); return; }

        socket?.emit("Iniciar Llamada", { to, type });
    }, [socket, startLocalStream]);

    // ---- ACEPTAR LLAMADA ----
    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;
        setIncomingCall(null);

        const { from, type, callId } = incomingCall;
        setRemoteUser(from);
        setCallType(type);
        setCallState("active");

        const videoEnabled = type === "video";
        const stream = await startLocalStream(videoEnabled);
        if (!stream) return;

        socket?.emit("Aceptar Llamada", { callId, from, to: from });
    }, [incomingCall, socket, startLocalStream]);

    const rejectCall = useCallback(() => {
        if (!incomingCall) return;
        socket?.emit("Aceptar Llamada", { callId: incomingCall.callId, from: incomingCall.from, to: incomingCall.from, rejected: true });
        setIncomingCall(null);
    }, [incomingCall, socket]);

    // ---- SOCKET EVENTS ----
    useEffect(() => {
        if (!socket) return;

        socket.on("Llamada Entrante", ({ from, type, callId }) => {
            setIncomingCall({ from, type, callId });
        });

        socket.on("Llamada Aceptada", async ({ from }) => {
            // El destinatario aceptó — iniciar WebRTC como caller
            setCallState("active");
            const pc = createPeerConnection(from);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("Oferta WebRTC", { offer, to: from });
            startTimer();
        });

        socket.on("Oferta WebRTC", async ({ offer, from }) => {
            // Recibir oferta como callee
            const pc = createPeerConnection(from);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("Respuesta WebRTC", { answer, to: from });
            startTimer();
        });

        socket.on("Respuesta WebRTC", async ({ answer }) => {
            await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ICE Candidate", async ({ candidate }) => {
            try {
                await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error("Error ICE candidate:", err);
            }
        });

        socket.on("Llamada Terminada", () => {
            handleEndCall();
        });

        return () => {
            socket.off("Llamada Entrante");
            socket.off("Llamada Aceptada");
            socket.off("Oferta WebRTC");
            socket.off("Respuesta WebRTC");
            socket.off("ICE Candidate");
            socket.off("Llamada Terminada");
        };
    }, [socket, createPeerConnection, handleEndCall]);

    // ---- CONTROLES ----
    const toggleMute = useCallback(() => {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        }
    }, []);

    const toggleVideo = useCallback(() => {
        const track = localStreamRef.current?.getVideoTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsVideoOff(!track.enabled);
        }
    }, []);

    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            // Volver a cámara
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const camTrack = camStream.getVideoTracks()[0];
            const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
            sender?.replaceTrack(camTrack);
            if (localVideoRef.current) localVideoRef.current.srcObject = camStream;
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrack.onended = () => setIsScreenSharing(false);
                const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
                sender?.replaceTrack(screenTrack);
                if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
                setIsScreenSharing(true);
            } catch (err) {
                console.error("Error compartiendo pantalla:", err);
            }
        }
    }, [isScreenSharing]);

    const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return createPortal(
        <>
            {/* Llamada entrante */}
            {incomingCall && (
                <div className="fixed inset-0 bg-black/80 z-10000 flex items-center justify-center">
                    <div className="bg-[#1e1e1e] border border-white/10 p-6 rounded-2xl text-center shadow-2xl">
                        <div className="text-5xl mb-4 animate-bounce">📞</div>
                        <p className="text-white font-bold text-lg mb-1">{incomingCall.from}</p>
                        <p className="text-white/50 text-sm mb-6">
                            {incomingCall.type === "video" ? "📹 Videollamada" : "🎤 Llamada de voz"}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={acceptCall}
                                className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition cursor-pointer font-bold">
                                ✅ Aceptar
                            </button>
                            <button onClick={rejectCall}
                                className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition cursor-pointer font-bold">
                                ❌ Rechazar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Llamando... */}
            {callState === "calling" && (
                <div className="fixed inset-0 bg-black/70 z-9998 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-28 h-28 rounded-full border-4 border-pink-400 border-t-transparent animate-spin mx-auto mb-6"/>
                        <p className="text-white text-xl font-bold mb-2">Llamando a {remoteUser}...</p>
                        <p className="text-white/50 text-sm mb-6">{callType === "video" ? "📹 Videollamada" : "🎤 Voz"}</p>
                        <button onClick={endCall}
                            className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition cursor-pointer font-bold">
                            📴 Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Llamada activa */}
            {callState === "active" && (
                <div className="fixed inset-0 bg-black z-9999 flex flex-col">
                    {/* Video remoto o avatar */}
                    {callType === "video" ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="flex-1 object-cover w-full"/>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-linear-to-b from-gray-900 to-black">
                            <div className="text-center">
                                <div className="w-32 h-32 rounded-full bg-pink-400 flex items-center justify-center text-6xl mx-auto mb-4">👤</div>
                                <p className="text-white text-2xl font-bold">{remoteUser}</p>
                                <p className="text-white/50 text-sm mt-2">{formatDuration(callDuration)}</p>
                            </div>
                        </div>
                    )}

                    {/* Video local (pip) */}
                    {callType === "video" && !isVideoOff && (
                        <div className="absolute top-4 right-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
                        </div>
                    )}

                    {/* Info superior */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse font-bold">
                            🔴 {formatDuration(callDuration)}
                        </span>
                        {callType === "video" && (
                            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">📹</span>
                        )}
                    </div>

                    {/* Controles */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 items-center">
                        <button onClick={toggleMute}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition cursor-pointer shadow-lg ${isMuted ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}>
                            {isMuted ? "🔇" : "🎤"}
                        </button>

                        {callType === "video" && (
                            <button onClick={toggleVideo}
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition cursor-pointer shadow-lg ${isVideoOff ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}>
                                {isVideoOff ? "📵" : "📹"}
                            </button>
                        )}

                        <button onClick={endCall}
                            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-3xl transition cursor-pointer shadow-xl">
                            📴
                        </button>

                        {callType === "video" && (
                            <button onClick={toggleScreenShare}
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition cursor-pointer shadow-lg ${isScreenSharing ? "bg-green-500" : "bg-white/20 hover:bg-white/30"}`}>
                                🖥️
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}

// ---- Botón de llamada para el header ----
export function CallButton({ socket, currentUser }) {
    const { connectedUsers } = useChat();
    const [showMenu, setShowMenu] = useState(false);

    const users = connectedUsers.filter(u => u !== currentUser);

    const initiateCall = useCallback((to, type) => {
        setShowMenu(false);
        socket?.emit("Iniciar Llamada", { to, type });
    }, [socket]);

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(p => !p)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm hover:scale-105 transition cursor-pointer border bg-white/90 border-gray-200"
            >
                📞
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}/>
                    <div className="absolute right-0 top-10 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl z-50 py-2 min-w-44">
                        <div className="text-white/40 text-xs px-3 py-1 border-b border-white/10 mb-1">
                            📞 Llamar a:
                        </div>
                        {users.length === 0 ? (
                            <div className="text-white/30 text-xs px-3 py-3 text-center">
                                No hay otros usuarios conectados
                            </div>
                        ) : (
                            users.map(user => (
                                <div key={user} className="border-b border-white/5 last:border-0">
                                    <div className="text-white/60 text-xs px-3 pt-2 pb-1">{user}</div>
                                    <div className="flex">
                                        <button
                                            onClick={() => initiateCall(user, "audio")}
                                            className="flex-1 text-white text-xs px-3 py-2 hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5"
                                        >
                                            🎤 Voz
                                        </button>
                                        <button
                                            onClick={() => initiateCall(user, "video")}
                                            className="flex-1 text-white text-xs px-3 py-2 hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5"
                                        >
                                            📹 Video
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}