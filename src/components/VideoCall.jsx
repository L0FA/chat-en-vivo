import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChat } from "../hooks/useChat";

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
];

export default function VideoCall({ socket, currentRoom = null, externalTrigger = 0 }) {
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
    const [callPosition, setCallPosition] = useState({ x: 4, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [hasLocalVideo, setHasLocalVideo] = useState(false);
    const [remoteHasVideo, setRemoteHasVideo] = useState(false);
    const [availableDevices, setAvailableDevices] = useState({ audioInputs: [], videoInputs: [], audioOutputs: [] });
    const [speakerVolume, setSpeakerVolume] = useState(() => {
        const saved = localStorage.getItem("speaker-volume");
        return saved ? parseInt(saved) : 100;
    });
    const [micVolume, setMicVolume] = useState(() => {
        const saved = localStorage.getItem("mic-volume");
        return saved ? parseInt(saved) : 100;
    });

    const localVideoRef = useRef(null);
    const localVideoSmallRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const timerRef = useRef(null);
    const screenStreamRef = useRef(null);

    useEffect(() => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = speakerVolume / 100;
        }
    }, [speakerVolume]);

    const getDevicePreferences = () => {
        const saved = localStorage.getItem("device-preferences");
        if (saved) return JSON.parse(saved);
        return { video: true, audio: true, facingMode: "user", audioInputId: null, videoInputId: null };
    };

    const refreshDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === "audioinput");
            const videoInputs = devices.filter(d => d.kind === "videoinput");
            const audioOutputs = devices.filter(d => d.kind === "audiooutput");
            setAvailableDevices({ audioInputs, videoInputs, audioOutputs });
            console.log("📹 Dispositivos:", { audioInputs: audioInputs.length, videoInputs: videoInputs.length, audioOutputs: audioOutputs.length });
        } catch (e) {
            console.error("Error enumerando dispositivos:", e);
        }
    };

    const getRemoteUserAvatar = () => {
        if (!remoteUser) return null;
        const remote = connectedUsers.find(u => {
            const nombre = typeof u === "string" ? u : u?.nombre;
            return nombre === remoteUser;
        });
        if (!remote || typeof remote === "string") return null;
        return remote.avatar;
    };

    const getIncomingUserAvatar = () => {
        if (!incomingCall?.from) return null;
        const remote = connectedUsers.find(u => {
            const nombre = typeof u === "string" ? u : u?.nombre;
            return nombre === incomingCall.from;
        });
        if (!remote || typeof remote === "string") return null;
        return remote.avatar;
    };

    const otherUsers = connectedUsers.filter(u => {
        const nombre = typeof u === "string" ? u : u?.nombre;
        return nombre !== user;
    });

    const playRingtone = () => {
        try {
            const audio = new Audio("https://www.soundjay.com/phone/cell-phone-ringing-01.mp3");
            audio.loop = true;
            audio.volume = 0.7;
            audio.play().then(() => {
                console.log("🔔 Ringtone reproducido exitosamente");
            }).catch(e => console.log("No se pudo reproducir ringtone:", e));
        } catch (e) {
            console.log("Error creando audio:", e);
        }
    };

    const testAudioOutput = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 440;
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
            console.log("🔊 Test de audio ejecutado");
        } catch (e) {
            console.error("Error en test de audio:", e);
        }
    };

    const startLocalStream = async (video) => {
        const prefs = getDevicePreferences();
        try {
            const constraints = {
                audio: prefs.audio ? (prefs.audioInputId ? { deviceId: { exact: prefs.audioInputId } } : true) : false,
                video: video && prefs.video ? (prefs.videoInputId ? { deviceId: { exact: prefs.videoInputId }, facingMode: prefs.facingMode || "user" } : { facingMode: prefs.facingMode || "user" }) : false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
            const stream = e.streams[0];
            const hasVideo = stream.getVideoTracks().length > 0;
            setRemoteHasVideo(hasVideo);
            
            if (remoteVideoRef.current && stream) {
                remoteVideoRef.current.srcObject = stream;
            }
            if (remoteAudioRef.current && stream) {
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.volume = speakerVolume / 100;
                remoteAudioRef.current.play().then(() => {
                    console.log("🔊 Audio remoto reproduce!");
                }).catch(e => console.log("Error reproduciendo audio:", e));
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
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
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

    const handleOfferFunc = async (offer, from) => {
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
        console.log("📴 Terminando llamada...");
        socket.emit("llamada:end", { to: remoteUser });
        endCallCleanup();
    };

    const toggleMute = () => {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
        }
    };

    const toggleVideo = async () => {
        const currentTrack = localStreamRef.current?.getVideoTracks()[0];
        
        if (currentTrack) {
            currentTrack.enabled = !currentTrack.enabled;
            setIsVideoOff(!currentTrack.enabled);
            if (!currentTrack.enabled) {
                setHasLocalVideo(false);
            }
        } else {
            try {
                const prefs = getDevicePreferences();
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: prefs.videoInputId ? { deviceId: { exact: prefs.videoInputId } } : true,
                    audio: prefs.audio
                });
                
                const newVideoTrack = newStream.getVideoTracks()[0];
                const audioTrack = newStream.getAudioTracks()[0];
                
                if (!localStreamRef.current) {
                    localStreamRef.current = newStream;
                } else {
                    if (audioTrack) {
                        localStreamRef.current.addTrack(audioTrack);
                        peerConnectionRef.current?.addTrack(audioTrack, localStreamRef.current);
                    }
                    if (newVideoTrack) {
                        localStreamRef.current.addTrack(newVideoTrack);
                    }
                }
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }
                if (localVideoSmallRef.current) {
                    localVideoSmallRef.current.srcObject = localStreamRef.current;
                }
                
                if (newVideoTrack) {
                    const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
                    if (sender) {
                        sender.replaceTrack(newVideoTrack);
                    }
                }
                
                setIsVideoOff(false);
                setHasLocalVideo(true);
            } catch (err) {
                console.error("Error prendiendo cámara:", err);
            }
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }
            const videoTrack = localStreamRef.current?.getVideoTracks()[0];
            if (videoTrack) {
                const prefs = getDevicePreferences();
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: prefs.video ? { facingMode: prefs.facingMode || "user" } : false
                });
                const newVideoTrack = newStream.getVideoTracks()[0];
                const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
                if (sender) sender.replaceTrack(newVideoTrack);
                localStreamRef.current = newStream;
                if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];
                const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
                if (sender) sender.replaceTrack(screenTrack);
                screenTrack.onended = () => {
                    toggleScreenShare();
                };
                setIsScreenSharing(true);
            } catch (err) {
                console.error("Error compartir pantalla:", err);
            }
        }
    };

    const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    const handleDragStart = () => {
        if (showRemoteFull) return;
        setIsDragging(true);
    };

    const handleDrag = (e) => {
        if (!isDragging || showRemoteFull) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const x = ((window.innerWidth - clientX - 140) / window.innerWidth) * 100;
        const y = ((window.innerHeight - clientY - 120) / window.innerHeight) * 100;
        
        setCallPosition({ 
            x: Math.max(0, Math.min(80, x)), 
            y: Math.max(20, Math.min(80, y)) 
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (externalTrigger > 0) {
            console.log("📞 Trigger externo recibido, mostrando menú");
            setTimeout(() => setShowCallMenu(true), 0);
        }
    }, [externalTrigger]);

    useEffect(() => {
        setTimeout(() => setShowCallMenu(false), 0);
    }, [currentRoom]);

    useEffect(() => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = speakerVolume / 100;
        }
    }, [speakerVolume]);

    useEffect(() => {
        if (callState === "active" && remoteAudioRef.current && localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                console.log("🎤 Audio track encontrado:", audioTrack.enabled ? "activo" : "muted");
            }
        }
    }, [callState]);

    useEffect(() => {
        if (callState === "active" && remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(e => {
                console.log("🔇 Audio butuh interacción:", e.message);
            });
        }
    }, [callState]);

    useEffect(() => {
        if (incomingCall) {
            playRingtone();
        }
    }, [incomingCall]);

    useEffect(() => {
        if (showDeviceSettings) {
            setTimeout(() => refreshDevices(), 0);
        }
    }, [showDeviceSettings]);

    useEffect(() => {
        if (!socket) return;

        const handleInvite = ({ from, type, callId }) => {
            console.log("📞 Llamada entrante de:", from, type);
            setIncomingCall({ from, type, callId });
        };

        const handleAccept = ({ from }) => {
            console.log("📞 Llamada aceptada por:", from);
            startWebRTC(from);
        };

        const handleReject = () => {
            console.log("📞 Llamada rechazada");
            setCallState("idle");
            setRemoteUser(null);
        };

        const handleOffer = async ({ offer, from }) => {
            console.log("📞 Oferta recibida de:", from);
            await handleOfferFunc(offer, from);
        };

        const handleAnswer = async ({ answer }) => {
            console.log("📞 Respuesta recibida");
            if (peerConnectionRef.current?.signalingState === "have-local-offer") {
                await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };

        const handleIce = async ({ candidate }) => {
            console.log("📞 ICE recibido");
            try {
                await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding ICE:", e);
            }
        };

        const handleEnd = () => {
            console.log("📞 Llamada terminada");
            endCallCleanup();
        };

        socket.on("llamada:invite", handleInvite);
        socket.on("llamada:accept", handleAccept);
        socket.on("llamada:reject", handleReject);
        socket.on("llamada:offer", handleOffer);
        socket.on("llamada:answer", handleAnswer);
        socket.on("llamada:ice", handleIce);
        socket.on("llamada:end", handleEnd);

        return () => {
            socket.off("llamada:invite", handleInvite);
            socket.off("llamada:accept", handleAccept);
            socket.off("llamada:reject", handleReject);
            socket.off("llamada:offer", handleOffer);
            socket.off("llamada:answer", handleAnswer);
            socket.off("llamada:ice", handleIce);
            socket.off("llamada:end", handleEnd);
        };
    }, [socket, startWebRTC, endCallCleanup]);

    return createPortal(
        <>
            {showCallMenu && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-9998 animate-fade-in"
                        onClick={() => setShowCallMenu(false)}
                    />
                    <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none">
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

            {showDeviceSettings && (
                <div className="fixed inset-0 bg-black/70 z-10001 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] border border-white/10 p-6 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <h3 className="text-white font-bold text-xl mb-6 text-center">🎛️ Dispositivos</h3>
                        
                        <button 
                            onClick={refreshDevices}
                            className="mb-4 text-sm text-pink-400 hover:text-pink-300 cursor-pointer flex items-center gap-2"
                        >
                            <span>🔄</span> Actualizar dispositivos
                        </button>
                        
                        <button 
                            onClick={testAudioOutput}
                            className="mb-4 ml-2 text-sm text-green-400 hover:text-green-300 cursor-pointer flex items-center gap-2"
                        >
                            <span>🔊</span> Probar audio
                        </button>
                        
                        <div className="space-y-6">
                            {availableDevices.audioInputs.length > 0 && (
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">🎤</span>
                                        <span className="text-white font-medium">Micrófono</span>
                                    </div>
                                    <select 
                                        value={getDevicePreferences().audioInputId || ""}
                                        onChange={(e) => {
                                            const prefs = getDevicePreferences();
                                            const newPrefs = { ...prefs, audioInputId: e.target.value || null };
                                            localStorage.setItem("device-preferences", JSON.stringify(newPrefs));
                                        }}
                                        className="w-full bg-black/30 text-white border border-white/20 rounded-lg px-3 py-2.5"
                                    >
                                        <option value="">Predeterminado del sistema</option>
                                        {availableDevices.audioInputs.map(d => (
                                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Micrófono ${d.deviceId.slice(0,8)}`}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            {availableDevices.videoInputs.length > 0 && (
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xl">📹</span>
                                        <span className="text-white font-medium">Cámara</span>
                                    </div>
                                    <select 
                                        value={getDevicePreferences().videoInputId || ""}
                                        onChange={(e) => {
                                            const prefs = getDevicePreferences();
                                            const newPrefs = { ...prefs, videoInputId: e.target.value || null };
                                            localStorage.setItem("device-preferences", JSON.stringify(newPrefs));
                                        }}
                                        className="w-full bg-black/30 text-white border border-white/20 rounded-lg px-3 py-2.5"
                                    >
                                        <option value="">Predeterminada del sistema</option>
                                        {availableDevices.videoInputs.map(d => (
                                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Cámara ${d.deviceId.slice(0,8)}`}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">🔊</span>
                                    <span className="text-white font-medium">Audio</span>
                                </div>
                                <label className="flex items-center justify-between cursor-pointer mb-3">
                                    <span className="text-white/80">Enviar audio</span>
                                    <input 
                                        type="checkbox" 
                                        checked={getDevicePreferences().audio}
                                        onChange={(e) => {
                                            const prefs = getDevicePreferences();
                                            localStorage.setItem("device-preferences", JSON.stringify({ ...prefs, audio: e.target.checked }));
                                        }}
                                        className="w-6 h-6 accent-pink-500"
                                    />
                                </label>
                                {getDevicePreferences().audio && (
                                    <div>
                                        <div className="text-white/60 text-xs mb-1">Volumen del micrófono</div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="200" 
                                            value={micVolume}
                                            onChange={(e) => {
                                                const vol = parseInt(e.target.value);
                                                setMicVolume(vol);
                                                localStorage.setItem("mic-volume", vol);
                                            }}
                                            className="w-full accent-pink-500"
                                        />
                                        <div className="text-white/60 text-xs text-center mt-1">{micVolume}%</div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">🔈</span>
                                    <span className="text-white font-medium">Altavoz</span>
                                </div>
                                <div>
                                    <div className="text-white/60 text-xs mb-1">Volumen de llamada</div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={speakerVolume}
                                        onChange={(e) => {
                                            const vol = parseInt(e.target.value);
                                            setSpeakerVolume(vol);
                                            localStorage.setItem("speaker-volume", vol);
                                            if (remoteAudioRef.current) remoteAudioRef.current.volume = vol / 100;
                                        }}
                                        className="w-full accent-pink-500"
                                    />
                                    <div className="text-white/60 text-xs text-center mt-1">{speakerVolume}%</div>
                                </div>
                            </div>
                            
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">📹</span>
                                    <span className="text-white font-medium">Video</span>
                                </div>
                                <label className="flex items-center justify-between cursor-pointer mb-3">
                                    <span className="text-white/80">Enviar video</span>
                                    <input 
                                        type="checkbox" 
                                        checked={getDevicePreferences().video}
                                        onChange={(e) => {
                                            const prefs = getDevicePreferences();
                                            localStorage.setItem("device-preferences", JSON.stringify({ ...prefs, video: e.target.checked }));
                                        }}
                                        className="w-6 h-6 accent-pink-500"
                                    />
                                </label>
                                {availableDevices.videoInputs.length > 1 && (
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="text-white/80">Usar cámara frontal</span>
                                        <input 
                                            type="checkbox" 
                                            checked={getDevicePreferences().facingMode === "user"}
                                            onChange={(e) => {
                                                const prefs = getDevicePreferences();
                                                localStorage.setItem("device-preferences", JSON.stringify({ ...prefs, facingMode: e.target.checked ? "user" : "environment" }));
                                            }}
                                            className="w-6 h-6 accent-pink-500"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowDeviceSettings(false)}
                            className="mt-6 w-full bg-pink-500 text-white py-3 rounded-xl font-bold hover:bg-pink-600 cursor-pointer text-lg"
                        >
                            ✓ Listo
                        </button>
                    </div>
                </div>
            )}

            {incomingCall && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-9998 animate-fade-in" />
                    <div className="fixed inset-0 z-9999 flex items-center justify-center animate-scale-in">
                        <div className="bg-[#1e1e1e] border border-white/20 p-8 rounded-3xl text-center shadow-2xl w-80 mx-4">
                            <div className="relative w-24 h-24 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full bg-pink-400 animate-pulse opacity-60" style={{ animationDuration: '1s' }} />
                                <div className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-40" style={{ animationDuration: '1.5s' }} />
                                {(() => {
                                    const incomingAvatar = getIncomingUserAvatar();
                                    const isImageAvatar = incomingAvatar && incomingAvatar.startsWith("data:image");
                                    return isImageAvatar ? (
                                        <img src={incomingAvatar} alt="" className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-pink-400/50" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-linear-to-br from-pink-400 to-purple-500 flex items-center justify-center text-5xl shadow-lg ring-4 ring-pink-400/50">👤</div>
                                    );
                                })()}
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

            {callState === "active" && (
                <div 
                    className={`call-container fixed z-9997 transition-all duration-300 select-none ${
                        showRemoteFull ? "inset-0 bg-black" : ""
                    }`}
                    style={!showRemoteFull ? { 
                        right: `${callPosition.x}%`, 
                        bottom: `${callPosition.y}%`,
                        transition: isDragging ? 'none' : 'all 0.3s ease'
                    } : {}}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDrag}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDrag}
                    onTouchEnd={handleDragEnd}
                >
                    <div 
                        className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 cursor-move ${
                            showRemoteFull ? "w-full h-full" : "w-56 h-40"
                        }`}
                    >
                        {remoteHasVideo ? (
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-900 to-black">
                                <div className="text-center">
                                    {(() => {
                                        const remoteAvatar = getRemoteUserAvatar();
                                        const isImageAvatar = remoteAvatar && remoteAvatar.startsWith("data:image");
                                        return isImageAvatar ? (
                                            <img src={remoteAvatar} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-2" />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-pink-400 flex items-center justify-center text-4xl mx-auto mb-2">👤</div>
                                        );
                                    })()}
                                    <p className="text-white font-bold">{remoteUser}</p>
                                </div>
                            </div>
                        )}
                        <audio 
                            ref={remoteAudioRef} 
                            autoPlay 
                            playsInline
                            className="hidden"
                        />
                        
                        <div 
                            className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 hover:opacity-100 bg-black/40 pointer-events-none"
                        >
                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">{remoteUser}</span>
                        </div>
                    </div>

                    <div 
                        className={`flex gap-2 bg-black/80 backdrop-blur-md px-3 py-2 rounded-full shadow-lg transition-all ${
                            showRemoteFull ? "absolute bottom-4 left-1/2 -translate-x-1/2" : "mt-2 justify-center"
                        }`}
                    >
                        <button 
                            onClick={toggleMute} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition ${isMuted ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}
                        >
                            {isMuted ? "🔇" : "🎤"}
                        </button>
                        <button 
                            onClick={toggleVideo} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition ${hasLocalVideo && !isVideoOff ? "bg-green-500" : "bg-red-500"}`}
                            title={hasLocalVideo && !isVideoOff ? "Apagar cámara" : "Encender cámara"}
                        >
                            {hasLocalVideo && !isVideoOff ? "📹" : "📵"}
                        </button>
                        {callType === "video" && (
                            <button 
                                onClick={toggleScreenShare} 
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition ${isScreenSharing ? "bg-green-500" : "bg-white/20 hover:bg-white/30"}`}
                                title={isScreenSharing ? "Dejar de compartir" : "Compartir pantalla"}
                            >
                                {isScreenSharing ? "🛑" : "🖥️"}
                            </button>
                        )}
                        <div className="relative">
                            <button 
                                onClick={() => setShowVolumeSlider(p => !p)}
                                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg transition"
                                title="Volumen"
                            >
                                🔊
                            </button>
                            {showVolumeSlider && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 rounded-xl p-3 w-40">
                                    <div className="text-white text-xs text-center mb-2">Volumen</div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={speakerVolume}
                                        onChange={(e) => {
                                            const vol = parseInt(e.target.value);
                                            setSpeakerVolume(vol);
                                            localStorage.setItem("speaker-volume", vol);
                                            if (remoteAudioRef.current) remoteAudioRef.current.volume = vol / 100;
                                        }}
                                        className="w-full accent-pink-500"
                                    />
                                    <div className="text-white/60 text-xs text-center mt-1">{speakerVolume}%</div>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => setShowRemoteFull(p => !p)}
                            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg transition"
                            title={showRemoteFull ? "Minimizar" : "Expandir"}
                        >
                            {showRemoteFull ? "🔲" : "⛶"}
                        </button>
                        <button 
                            onClick={endCall} 
                            className="w-12 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-xl"
                        >
                            📴
                        </button>
                    </div>

                    {!showRemoteFull && (
                        <div className="text-center mt-1">
                            <span className="text-white/60 text-xs">🔴 {fmt(callDuration)}</span>
                        </div>
                    )}
                    
                    {/* Vista previa local */}
                    {hasLocalVideo && !isVideoOff && (
                        <div className="mt-2">
                            <div className="relative w-20 h-15 rounded-lg overflow-hidden bg-black">
                                <video ref={localVideoSmallRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
                                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1 rounded">Tú</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>,
        document.body
    );
}