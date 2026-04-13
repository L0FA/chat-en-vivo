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
    const [showRemoteFull, setShowRemoteFull] = useState(false);
    const [mobileNameShown, setMobileNameShown] = useState(false);
    const mobileTapTimer = useRef(null);

    // Efecto para detectar el trigger externo
    useEffect(() => {
        if (externalTrigger > 0) {
            console.log("📞 Trigger externo recibido, mostrando menú");
            setShowCallMenu(true);
        }
    }, [externalTrigger]);

    // Cerrar menú cuando cambia de sala
    useEffect(() => {
        setShowCallMenu(false);
    }, [currentRoom]);
    const [showButton, setShowButton] = useState(true);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const timerRef = useRef(null);

    // connectedUsers puede ser array de strings o de objetos {nombre, avatar}
    const otherUsers = connectedUsers.filter(u => {
        const nombre = typeof u === "string" ? u : u?.nombre;
        return nombre !== user;
    });

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
            {/* Menú de llamada como popup animado con backdrop */}
            {showCallMenu && (
                <>
                    {/* Backdrop oscuro */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
                        onClick={() => setShowCallMenu(false)}
                    />
                    
                    {/* Popup centrado */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
                        <div 
                            className="bg-[#1e1e1e] border border-white/20 rounded-2xl shadow-2xl p-6 w-80 max-h-[70vh] overflow-y-auto pointer-events-auto animate-scale-in"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-lg">📞 Iniciar Llamada</h3>
                                <button 
                                    onClick={() => setShowCallMenu(false)}
                                    className="text-white/50 hover:text-white transition"
                                >
                                    ✖
                                </button>
                            </div>
                            
                            <div className="text-white/40 text-xs mb-3">Selecciona un usuario:</div>
                            
                            {otherUsers.length === 0 ? (
                                <div className="text-white/30 text-center py-6 text-sm">
                                    No hay otros usuarios en la sala
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {otherUsers.map(u => {
                                        const nombre = typeof u === "string" ? u : u?.nombre || "Usuario";
                                        const avatar = typeof u === "string" ? null : u?.avatar;
                                        const isImageAvatar = avatar && avatar.startsWith("data:image");
                                        
                                        return (
                                        <div key={nombre} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition cursor-pointer">
                                            {isImageAvatar ? (
                                                <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center text-lg">😀</div>
                                            )}
                                            <span className="flex-1 text-white font-medium">{nombre}</span>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => initiateCall(nombre, "audio")}
                                                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition"
                                                    title="Llamada de voz"
                                                >
                                                    🎤
                                                </button>
                                                <button 
                                                    onClick={() => initiateCall(nombre, "video")}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition"
                                                    title="Videollamada"
                                                >
                                                    📹
                                                </button>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <button 
                                    onClick={() => { setShowCallMenu(false); setShowDeviceSettings(true); }}
                                    className="w-full text-white/60 text-sm px-3 py-2 hover:bg-white/10 rounded-lg transition text-left flex items-center gap-2"
                                >
                                    🎛️ Configurar dispositivos
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

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
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in" />
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-scale-in">
                        <div className="bg-[#1e1e1e] border border-white/20 p-8 rounded-3xl text-center shadow-2xl w-80 mx-4">
                            <div className="relative w-24 h-24 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-20" />
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-5xl shadow-lg">
                                    👤
                                </div>
                            </div>
                            <div className="text-white font-bold text-xl mb-1">{incomingCall.from}</div>
                            <p className="text-white/50 text-sm mb-6">
                                {incomingCall.type === "video" ? "📹 Te está llamando" : "🎤 Te está llamando"}
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button 
                                    onClick={acceptCall} 
                                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full hover:scale-105 transition cursor-pointer font-bold shadow-lg"
                                >
                                    ✅ Aceptar
                                </button>
                                <button 
                                    onClick={rejectCall} 
                                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full hover:scale-105 transition cursor-pointer font-bold shadow-lg"
                                >
                                    ❌
                                </button>
                            </div>
                        </div>
                    </div>
                </>
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

            {/* Llamada activa - ventana flotante */}
            {callState === "active" && (
                <div className="fixed z-[9997]">
                    {/* Video/Ventana flotante */}
                    <div 
                        className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 cursor-move ${
                            showRemoteFull ? "inset-4" : "w-48 h-48 bottom-20 right-4"
                        }`}
                        onClick={(e) => {
                            if (!showRemoteFull && window.innerWidth >= 768) {
                                e.stopPropagation();
                            }
                        }}
                        style={!showRemoteFull ? { position: 'fixed' } : {}}
                    >
                        {callType === "video" ? (
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full bg-pink-400 flex items-center justify-center text-4xl mx-auto mb-2">👤</div>
                                    <p className="text-white font-bold">{remoteUser}</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Hover/Touch para mostrar nombre */}
                        <div 
                            className={`absolute inset-0 flex items-end justify-center pb-2 transition-all ${
                                mobileNameShown ? "opacity-100 bg-black/40" : "opacity-0 hover:opacity-100 bg-black/40"
                            }`}
                            onClick={(e) => {
                                if ('ontouchstart' in window) {
                                    e.stopPropagation();
                                    if (mobileTapTimer.current) {
                                        // Doble click - expandir
                                        setShowRemoteFull(p => !p);
                                        clearTimeout(mobileTapTimer.current);
                                        mobileTapTimer.current = null;
                                    } else {
                                        // Primer click - mostrar nombre
                                        mobileTapTimer.current = setTimeout(() => {
                                            setMobileNameShown(true);
                                            setTimeout(() => setMobileNameShown(false), 3000);
                                            mobileTapTimer.current = null;
                                        }, 300);
                                    }
                                }
                            }}
                        >
                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">{remoteUser}</span>
                        </div>
                    </div>

                    {/* Controls flotantes */}
                    <div 
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-black/80 backdrop-blur-md px-4 py-3 rounded-full shadow-lg"
                    >
                        <button 
                            onClick={toggleMute} 
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${isMuted ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}
                        >
                            {isMuted ? "🔇" : "🎤"}
                        </button>
                        {callType === "video" && (
                            <button 
                                onClick={toggleVideo} 
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${isVideoOff ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}
                            >
                                {isVideoOff ? "📵" : "📹"}
                            </button>
                        )}
                        <button 
                            onClick={() => setShowRemoteFull(p => !p)}
                            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl transition"
                            title="Expandir"
                        >
                            {showRemoteFull ? "🔲" : "⛶"}
                        </button>
                        <button 
                            onClick={endCall} 
                            className="w-14 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-2xl"
                        >
                            📴
                        </button>
                    </div>

                    {/* Timer */}
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full">
                        <span className="text-white text-xs font-bold">🔴 {fmt(callDuration)}</span>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}