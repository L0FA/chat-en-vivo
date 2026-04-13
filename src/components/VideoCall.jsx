import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChat } from "../hooks/useChat";

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
];

export default function VideoCall({ socket, onClose, scrolled = false, currentRoom = null, externalTrigger = 0 }) {
    const { user, connectedUsers } = useChat();
    const [callState, setCallState] = useState("idle");
    const [callType, setCallType] = useState("audio");
    const [remoteUser, setRemoteUser] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [incomingCall, setIncomingCall] = useState(null);
    const [showCallMenu, setShowCallMenu] = useState(false);
    const [showDeviceSettings, setShowDeviceSettings] = useState(false);

    // Efecto para detectar el trigger externo
    useEffect(() => {
        if (externalTrigger > 0) {
            console.log("📞 Trigger externo recibido, mostrando menú");
            setShowCallMenu(true);
        }
    }, [externalTrigger]);
    const [showButton, setShowButton] = useState(true);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const timerRef = useRef(null);

    const otherUsers = connectedUsers.filter(u => u !== user);

    const getDevicePreferences = () => {
        const saved = localStorage.getItem("device-preferences");
        if (saved) return JSON.parse(saved);
        return { video: true, audio: true, facingMode: "user" };
    };

    useEffect(() => {
        if (!socket) return;

        socket.on("llamada:invite", ({ from, type, callId }) => {
            console.log("📞 Llamada entrante de:", from, type);
            setIncomingCall({ from, type, callId });
        });

        socket.on("llamada:accept", ({ from, callId }) => {
            console.log("📞 Llamada aceptada por:", from);
            startWebRTC(from);
        });

        socket.on("llamada:reject", ({ from }) => {
            console.log("📞 Llamada rechazada por:", from);
            setCallState("idle");
            setRemoteUser(null);
        });

        socket.on("llamada:offer", async ({ offer, from }) => {
            console.log("📞 Oferta recibida de:", from);
            await handleOffer(offer, from);
        });

        socket.on("llamada:answer", async ({ answer, from }) => {
            console.log("📞 Respuesta recibida de:", from);
            await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("llamada:ice", async ({ candidate, from }) => {
            console.log("📞 ICE de:", from);
            try {
                await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding ICE:", e);
            }
        });

        socket.on("llamada:end", ({ from }) => {
            console.log("📞 Llamada terminada por:", from);
            endCallCleanup();
        });

        return () => {
            socket.off("llamada:invite");
            socket.off("llamada:accept");
            socket.off("llamada:reject");
            socket.off("llamada:offer");
            socket.off("llamada:answer");
            socket.off("llamada:ice");
            socket.off("llamada:end");
        };
    }, [socket]);

    const startLocalStream = async (video) => {
        const prefs = getDevicePreferences();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: prefs.audio,
                video: video && prefs.video ? { facingMode: prefs.facingMode || "user" } : false
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (err) {
            console.error("Error cámara/mic:", err);
            return null;
        }
    };

    const createPeerConnection = (peerUser) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionRef.current = pc;

        localStreamRef.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current);
        });

        pc.ontrack = (e) => {
            if (remoteVideoRef.current && e.streams[0]) {
                remoteVideoRef.current.srcObject = e.streams[0];
            }
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("llamada:ice", { candidate: e.candidate, to: peerUser });
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log("🔗 WebRTC state:", state);
            if (state === "disconnected" || state === "failed" || state === "closed") {
                endCallCleanup();
            }
        };

        return pc;
    };

    const startWebRTC = async (peerUser) => {
        const stream = await startLocalStream(callType === "video");
        if (!stream) return;

        setCallState("active");
        setRemoteUser(peerUser);

        const pc = createPeerConnection(peerUser);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("llamada:offer", { offer, to: peerUser });

        startTimer();
    };

    const handleOffer = async (offer, from) => {
        const stream = await startLocalStream(callType === "video");
        if (!stream) return;

        setCallState("active");
        setRemoteUser(from);

        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("llamada:answer", { answer, to: from });

        startTimer();
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    };

    const endCallCleanup = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setCallState("idle");
        setRemoteUser(null);
        setCallDuration(0);
        setIncomingCall(null);
    };

    const initiateCall = async (to, type) => {
        setShowCallMenu(false);
        setRemoteUser(to);
        setCallType(type);
        setCallState("calling");

        socket.emit("llamada:invite", { to, type });
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        const { from, type, callId } = incomingCall;
        setCallType(type);
        setIncomingCall(null);
        socket.emit("llamada:accept", { to: from, callId });
    };

    const rejectCall = () => {
        if (!incomingCall) return;
        socket.emit("llamada:reject", { to: incomingCall.from });
        setIncomingCall(null);
    };

    const endCall = () => {
        socket.emit("llamada:end", { to: remoteUser });
        endCallCleanup();
        onClose?.();
    };

    const toggleMute = () => {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        }
    };

    const toggleVideo = () => {
        const track = localStreamRef.current?.getVideoTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsVideoOff(!track.enabled);
        }
    };

    const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return createPortal(
        <>
            {/* Botón de llamada */}
            <div className="relative z-50">
                <button 
                    onClick={(e) => {
                        console.log("📞 Click en botón de llamada, showCallMenu:", !showCallMenu);
                        setShowCallMenu(p => !p);
                    }} 
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm hover:scale-105 transition cursor-pointer border ${
                        scrolled
                            ? "bg-white/90 border-gray-200"
                            : "bg-white/20 border-white/30 backdrop-blur-sm"
                    }`}
                >
                    📞
                </button>
                {showCallMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCallMenu(false)}/>
                        <div className="absolute right-0 top-10 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl z-50 py-2 min-w-44">
                            <div className="text-white/40 text-xs px-3 py-1 border-b border-white/10 mb-1">📞 Llamar a:</div>
                            {otherUsers.length === 0 ? (
                                <div className="text-white/30 text-xs px-3 py-3 text-center">No hay usuarios</div>
                            ) : (
                                otherUsers.map(u => (
                                    <div key={u} className="border-b border-white/5 last:border-0">
                                        <div className="text-white/60 text-xs px-3 pt-2 pb-1">{u}</div>
                                        <div className="flex">
                                            <button onClick={() => initiateCall(u, "audio")} className="flex-1 text-white text-xs px-3 py-2 hover:bg-white/10 cursor-pointer">🎤 Voz</button>
                                            <button onClick={() => initiateCall(u, "video")} className="flex-1 text-white text-xs px-3 py-2 hover:bg-white/10 cursor-pointer">📹 Video</button>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div className="border-t border-white/10 mt-2 pt-2">
                                <button 
                                    onClick={() => { setShowCallMenu(false); setShowDeviceSettings(true); }}
                                    className="w-full text-white/60 text-xs px-3 py-2 hover:bg-white/10 cursor-pointer text-left"
                                >
                                    🎛️ Configurar dispositivos
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Device Settings Modal */}
            {showDeviceSettings && (
                <div className="fixed inset-0 bg-black/70 z-10001 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] border border-white/10 p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="text-white font-bold text-lg mb-4">🎛️ Preferencias de dispositivo</h3>
                        <div className="flex flex-col gap-4">
                            <label className="flex items-center justify-between">
                                <span className="text-white/80">🎤 Micrófono</span>
                                <input 
                                    type="checkbox" 
                                    checked={getDevicePreferences().audio}
                                    onChange={(e) => {
                                        const prefs = getDevicePreferences();
                                        localStorage.setItem("device-preferences", JSON.stringify({ ...prefs, audio: e.target.checked }));
                                    }}
                                    className="w-5 h-5"
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-white/80">📹 Cámara</span>
                                <input 
                                    type="checkbox" 
                                    checked={getDevicePreferences().video}
                                    onChange={(e) => {
                                        const prefs = getDevicePreferences();
                                        localStorage.setItem("device-preferences", JSON.stringify({ ...prefs, video: e.target.checked }));
                                    }}
                                    className="w-5 h-5"
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-white/80">👤 Cámara frontal</span>
                                <input 
                                    type="checkbox" 
                                    checked={getDevicePreferences().facingMode === "user"}
                                    onChange={(e) => {
                                        const prefs = getDevicePreferences();
                                        localStorage.setItem("device-preferences", JSON.stringify({ ...prefs, facingMode: e.target.checked ? "user" : "environment" }));
                                    }}
                                    className="w-5 h-5"
                                />
                            </label>
                        </div>
                        <button 
                            onClick={() => setShowDeviceSettings(false)}
                            className="mt-6 w-full bg-pink-500 text-white py-2 rounded-xl font-bold hover:bg-pink-600 cursor-pointer"
                        >
                            ✓ Listo
                        </button>
                    </div>
                </div>
            )}

            {/* Llamada entrante */}
            {incomingCall && (
                <div className="fixed inset-0 bg-black/80 z-10000 flex items-center justify-center">
                    <div className="bg-[#1e1e1e] border border-white/10 p-6 rounded-2xl text-center">
                        <div className="text-5xl mb-4 animate-bounce">📞</div>
                        <p className="text-white font-bold text-lg mb-1">{incomingCall.from}</p>
                        <p className="text-white/50 text-sm mb-6">{incomingCall.type === "video" ? "📹 Videollamada" : "🎤 Voz"}</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={acceptCall} className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 cursor-pointer font-bold">✅ Aceptar</button>
                            <button onClick={rejectCall} className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 cursor-pointer font-bold">❌ Rechazar</button>
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
                        <p className="text-white/50 text-sm mb-6">{callType === "video" ? "📹" : "🎤"}</p>
                        <button onClick={() => { setCallState("idle"); setRemoteUser(null); }} className="bg-red-500 text-white px-6 py-3 rounded-full cursor-pointer font-bold">📴 Cancelar</button>
                    </div>
                </div>
            )}

            {/* Llamada activa */}
            {callState === "active" && (
                <div className="fixed inset-0 bg-black z-9999 flex flex-col">
                    {callType === "video" ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="flex-1 object-cover w-full"/>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
                            <div className="text-center">
                                <div className="w-32 h-32 rounded-full bg-pink-400 flex items-center justify-center text-6xl mx-auto mb-4">👤</div>
                                <p className="text-white text-2xl font-bold">{remoteUser}</p>
                                <p className="text-white/50 text-sm mt-2">{fmt(callDuration)}</p>
                            </div>
                        </div>
                    )}
                    {callType === "video" && !isVideoOff && (
                        <div className="absolute top-4 right-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/30">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
                        </div>
                    )}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse font-bold">🔴 {fmt(callDuration)}</span>
                    </div>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
                        <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${isMuted ? "bg-red-500" : "bg-white/20"}`}>{isMuted ? "🔇" : "🎤"}</button>
                        {callType === "video" && <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${isVideoOff ? "bg-red-500" : "bg-white/20"}`}>{isVideoOff ? "📵" : "📹"}</button>}
                        <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-3xl">📴</button>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}