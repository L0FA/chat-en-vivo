import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

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
    const [showCallDialog, setShowCallDialog] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const timerRef = useRef(null);

    const startLocalStream = useCallback(async (videoEnabled) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: videoEnabled ? { facingMode: "user" } : false
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error("Error accessing media devices:", err);
            return null;
        }
    }, []);

    const startCall = useCallback(async () => {
        const videoEnabled = callType === "video" || callType === "screen";
        const stream = await startLocalStream(videoEnabled);
        if (!stream) return;

        setCallState("active");
        
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit("ICE Candidate", { 
                    candidate: event.candidate, 
                    to: remoteUser 
                });
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket?.emit("Oferta WebRTC", { offer, to: remoteUser });

        timerRef.current = setInterval(() => {
            setCallDuration(d => d + 1);
        }, 1000);
    }, [callType, startLocalStream, socket, remoteUser]);

    const handleOffer = useCallback(async (offer, from) => {
        const videoEnabled = callType === "video" || callType === "screen";
        const stream = await startLocalStream(videoEnabled);
        if (!stream) return;

        setCallState("active");
        
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit("ICE Candidate", { 
                    candidate: event.candidate, 
                    to: from 
                });
            }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket?.emit("Respuesta WebRTC", { answer, to: from });

        timerRef.current = setInterval(() => {
            setCallDuration(d => d + 1);
        }, 1000);
    }, [callType, startLocalStream, socket]);

    const handleAnswer = useCallback(async (answer) => {
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }, []);

    const handleCandidate = useCallback(async (candidate) => {
        if (!peerConnectionRef.current) return;
        try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error("Error adding ICE candidate:", err);
        }
    }, []);

    const endCall = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        setCallState("idle");
        setCallDuration(0);
        setIsMuted(false);
        setIsVideoOff(false);
        setIsScreenSharing(false);
        
        socket?.emit("Terminar Llamada", { to: remoteUser });
    }, [socket, remoteUser]);

    useEffect(() => {
        if (!socket) return;

        socket.on("Llamada Entrante", ({ from, type }) => {
            setIncomingCall({ from, type });
            setShowCallDialog(true);
        });

        socket.on("Llamada Aceptada", async ({ accepte }) => {
            if (!accepte) {
                setCallState("rejected");
                setTimeout(() => setCallState("idle"), 2000);
                return;
            }
            await startCall();
        });

        socket.on("Oferta WebRTC", async ({ offer, from }) => {
            await handleOffer(offer, from);
        });

        socket.on("Respuesta WebRTC", async ({ answer }) => {
            await handleAnswer(answer);
        });

        socket.on("ICE Candidate", async ({ candidate }) => {
            await handleCandidate(candidate);
        });

        socket.on("Llamada Terminada", () => {
            endCall();
            setRemoteUser(null);
        });

        return () => {
            socket.off("Llamada Entrante");
            socket.off("Llamada Aceptada");
            socket.off("Oferta WebRTC");
            socket.off("Respuesta WebRTC");
            socket.off("ICE Candidate");
            socket.off("Llamada Terminada");
        };
    }, [socket, handleOffer, handleAnswer, handleCandidate, endCall, startCall]);

    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;
        setShowCallDialog(false);
        
        socket?.emit("Aceptar Llamada", { to: incomingCall.from, accepte: true });
        
        setCallType(incomingCall.type);
        setRemoteUser(incomingCall.from);
        await startCall();
    }, [socket, incomingCall, startCall]);

    const rejectCall = useCallback(() => {
        socket?.emit("Aceptar Llamada", { to: incomingCall.from, accepte: false });
        setShowCallDialog(false);
        setIncomingCall(null);
    }, [socket, incomingCall]);

    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, []);

    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            if (localStreamRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                videoTrack?.stop();
                
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];
                localStreamRef.current.addTrack(newVideoTrack);
                
                const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
                sender?.replaceTrack(newVideoTrack);
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                
                screenTrack.onended = () => {
                    setIsScreenSharing(false);
                };
                
                if (localStreamRef.current) {
                    localStreamRef.current.addTrack(screenTrack);
                }
                
                const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
                sender?.replaceTrack(screenTrack);
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
            } catch (err) {
                console.error("Error sharing screen:", err);
            }
            setIsScreenSharing(true);
        }
    }, [isScreenSharing]);

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const showRemoteVideo = callType === "video" || callType === "screen";

    return createPortal(
        <>
            {showCallDialog && incomingCall && (
                <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl text-center">
                        <div className="text-4xl mb-4">📞</div>
                        <p className="text-white font-bold mb-2">
                            {incomingCall.from} está llamando
                        </p>
                        <p className="text-white/60 text-sm mb-4">
                            {incomingCall.type === "video" ? "📹 Video" : "🎤 Voz"}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={acceptCall}
                                className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition cursor-pointer"
                            >
                                ✅ Aceptar
                            </button>
                            <button
                                onClick={rejectCall}
                                className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition cursor-pointer"
                            >
                                ❌ Rechazar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {callState === "active" && (
                <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
                    {showRemoteVideo ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="flex-1 object-cover"
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-32 h-32 rounded-full bg-pink-400 flex items-center justify-center text-6xl text-white mb-4">
                                    👤
                                </div>
                                <p className="text-white text-xl font-bold">{remoteUser}</p>
                            </div>
                        </div>
                    )}

                    <div className="absolute top-4 right-4">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-24 h-32 object-cover rounded-xl border-2 border-white/30 ${isVideoOff ? "hidden" : ""}`}
                        />
                    </div>

                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded animate-pulse">
                            🔴 {formatDuration(callDuration)}
                        </span>
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                            {callType === "video" ? "📹" : "🎤"}
                        </span>
                    </div>

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                        <button
                            onClick={toggleMute}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition cursor-pointer ${
                                isMuted ? "bg-red-500" : "bg-gray-600"
                            }`}
                        >
                            {isMuted ? "🔇" : "🎤"}
                        </button>
                        
                        {callType === "video" && (
                            <button
                                onClick={toggleVideo}
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition cursor-pointer ${
                                    isVideoOff ? "bg-red-500" : "bg-gray-600"
                                }`}
                            >
                                {isVideoOff ? "📵" : "📹"}
                            </button>
                        )}

                        {callType === "video" && (
                            <button
                                onClick={toggleScreenShare}
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition cursor-pointer ${
                                    isScreenSharing ? "bg-green-500" : "bg-gray-600"
                                }`}
                            >
                                🖥️
                            </button>
                        )}

                        <button
                            onClick={endCall}
                            className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-2xl hover:bg-red-600 transition cursor-pointer"
                        >
                            📴
                        </button>
                    </div>
                </div>
            )}

            {callState === "calling" && (
                <div className="fixed inset-0 bg-black/60 z-[9998] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-24 h-24 rounded-full border-4 border-pink-400 border-t-transparent animate-spin mx-auto mb-4" />
                        <p className="text-white text-xl font-bold">Llamando a {remoteUser}...</p>
                        <p className="text-white/60 text-sm">{callType === "video" ? "📹 Video" : "🎤 Voz"}</p>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}

export function CallButton({ socket, currentUser }) {
    const [showMenu, setShowMenu] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (!socket) return;
        
        const updateUsers = () => {
            socket.emit("Get Usuarios Activos", {}, (res) => {
                setUsers(res.filter(u => u !== currentUser));
            });
        };
        
        updateUsers();
        socket.on("Usuario Conectado", updateUsers);
        socket.on("Usuario Desconectado", updateUsers);
        
        return () => {
            socket.off("Usuario Conectado", updateUsers);
            socket.off("Usuario Desconectado", updateUsers);
        };
    }, [socket, currentUser]);

    const initiateCall = useCallback((to, type) => {
        setShowMenu(false);
        socket?.emit("Iniciar Llamada", { to, type, from: currentUser });
    }, [socket, currentUser]);

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm hover:scale-105 transition cursor-pointer border bg-white/90 border-gray-200"
            >
                📞
            </button>

            {showMenu && (
                <div className="absolute right-0 top-10 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl z-50 py-2 min-w-40">
                    <div className="text-white/40 text-xs px-3 py-1">Llamar a:</div>
                    {users.length === 0 && (
                        <div className="text-white/40 text-xs px-3 py-2">No hay usuarios disponibles</div>
                    )}
                    {users.map(user => (
                        <div key={user} className="flex flex-col">
                            <button
                                onClick={() => initiateCall(user, "audio")}
                                className="text-white text-sm px-3 py-2 hover:bg-white/10 transition text-left flex items-center gap-2 cursor-pointer"
                            >
                                🎤 {user}
                            </button>
                            <button
                                onClick={() => initiateCall(user, "video")}
                                className="text-white text-sm px-3 py-2 hover:bg-white/10 transition text-left flex items-center gap-2 cursor-pointer"
                            >
                                📹 {user}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}