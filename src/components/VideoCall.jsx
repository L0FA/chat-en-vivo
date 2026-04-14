import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useChat } from "../hooks/useChat";

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
];

export default function VideoCall({ socket, currentRoom = null, callTrigger = 0, userAvatar = null }) {
    const { user, connectedUsers } = useChat();
    const [callState, setCallState] = useState("idle");
    const [callType, setCallType] = useState("audio");
    const [remoteUser, setRemoteUser] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [showCallDropdown, setShowCallDropdown] = useState(false);
    const [remoteHasVideo, setRemoteHasVideo] = useState(false);
    const [speakerVolume, setSpeakerVolume] = useState(() => {
        const saved = localStorage.getItem("speaker-volume");
        return saved ? parseInt(saved) : 100;
    });

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const timerRef = useRef(null);

    const getDevicePreferences = () => {
        const saved = localStorage.getItem("device-preferences");
        if (saved) return JSON.parse(saved);
        return { video: true, audio: true, facingMode: "user", audioInputId: null, videoInputId: null };
    };

    const startLocalStream = async (video) => {
        const prefs = getDevicePreferences();
        try {
            const constraints = {
                audio: prefs.audio !== false,
                video: video && prefs.video !== false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (err) {
            console.error("Error getting local stream:", err);
            return null;
        }
    };

    const createPeerConnection = (peerId) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionRef.current = pc;

        localStreamRef.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current);
        });

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            const hasVideo = stream.getVideoTracks().length > 0;
            setRemoteHasVideo(hasVideo);
            
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play().catch(() => {});
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit("webrtc:ice", { candidate: event.candidate, target: peerId });
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
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setCallState("idle");
        setRemoteUser(null);
        setCallDuration(0);
        setRemoteHasVideo(false);
    };

    const toggleMute = () => {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setIsMuted(!track.enabled);
            socket?.emit("call:status", { muted: !track.enabled });
        }
    };

    const toggleVideo = async () => {
        if (isVideoOff) {
            const stream = await startLocalStream(true);
            if (stream) {
                const videoTrack = stream.getVideoTracks()[0];
                const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
                if (sender && videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setIsVideoOff(false);
            }
        } else {
            const videoTrack = localStreamRef.current?.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = false;
                setIsVideoOff(true);
            }
        }
    };

    const endCall = () => {
        socket?.emit("call:leave");
        endCallCleanup();
    };

    const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    useEffect(() => {
        if (callTrigger > 0) {
            setShowCallDropdown(true);
        }
    }, [callTrigger]);

    useEffect(() => {
        if (!socket) return;

        socket.on("call:invite", async ({ from, type }) => {
            console.log("📞 Invited to call by:", from);
            setCallType(type);
            setRemoteUser(from);
            
            const stream = await startLocalStream(type === "video");
            if (!stream) return;

            setCallState("active");
            
            const pc = createPeerConnection(from);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("webrtc:offer", { offer, target: from });
            
            startTimer();
        });

        socket.on("call:join", async ({ user: joiner }) => {
            console.log("📞 User joined call:", joiner);
        });

        socket.on("call:leave", ({ user: leaver }) => {
            console.log("📞 User left call:", leaver);
            if (leaver !== user) {
                setRemoteHasVideo(false);
            }
        });

        socket.on("webrtc:offer", async ({ offer, from }) => {
            console.log("📞 Received offer from:", from);
            
            const stream = await startLocalStream(callType === "video");
            if (!stream) return;

            setCallState("active");
            
            const pc = createPeerConnection(from);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("webrtc:answer", { answer, target: from });
            
            startTimer();
        });

        socket.on("webrtc:answer", async ({ answer }) => {
            console.log("📞 Received answer");
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on("webrtc:ice", async ({ candidate }) => {
            try {
                await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding ICE:", e);
            }
        });

        return () => {
            socket.off("call:invite");
            socket.off("call:join");
            socket.off("call:leave");
            socket.off("webrtc:offer");
            socket.off("webrtc:answer");
            socket.off("webrtc:ice");
        };
    }, [socket, callType, user]);

    const initiateCall = (targetUser, type) => {
        setShowCallDropdown(false);
        setCallType(type);
        setCallState("calling");
        socket?.emit("call:invite", { to: targetUser, type, room: currentRoom });
        
        startLocalStream(type === "video").then(stream => {
            if (stream) {
                setCallState("active");
                startTimer();
            }
        });
    };

    const otherUsers = connectedUsers.filter(u => {
        const nombre = typeof u === "string" ? u : u?.nombre;
        return nombre !== user;
    });

    const getRemoteUserAvatar = (username) => {
        const remote = connectedUsers.find(u => {
            const nombre = typeof u === "string" ? u : u?.nombre;
            return nombre === username;
        });
        if (!remote || typeof remote === "string") return null;
        return remote.avatar;
    };

    return createPortal(
        <>
            {callState === "idle" && showCallDropdown && (
                <div className="fixed inset-0 z-[9998]">
                    <div 
                        className="absolute inset-0 bg-black/40" 
                        onClick={() => setShowCallDropdown(false)}
                    />
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-white/20 rounded-2xl p-4 shadow-2xl min-w-72 animate-scale-in">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-white font-bold">📞 Llamar</span>
                            <button 
                                onClick={() => setShowCallDropdown(false)}
                                className="text-white/50 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {otherUsers.length === 0 ? (
                            <div className="text-white/30 text-sm text-center py-4">No hay usuarios disponibles</div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                                {otherUsers.map(u => {
                                    const nombre = typeof u === "string" ? u : u?.nombre;
                                    const avatar = typeof u === "string" ? null : u?.avatar;
                                    const isImage = avatar && avatar.startsWith("data:image");
                                    
                                    return (
                                        <div key={nombre} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition">
                                            {isImage ? (
                                                <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center text-xl">😀</div>
                                            )}
                                            <span className="flex-1 text-white font-medium truncate">{nombre}</span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => initiateCall(nombre, "audio")}
                                                    className="w-9 h-9 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-white"
                                                    title="Llamada de voz"
                                                >
                                                    🎤
                                                </button>
                                                <button
                                                    onClick={() => initiateCall(nombre, "video")}
                                                    className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white"
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
                    </div>
                </div>
            )}

            {callState === "calling" && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full border-4 border-pink-400 border-t-transparent animate-spin mx-auto mb-4"/>
                        <p className="text-white text-xl">Conectando...</p>
                        <button onClick={endCall} className="mt-4 bg-red-500 text-white px-6 py-2 rounded-full">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {callState === "active" && (
                <div className="fixed bottom-20 right-4 z-40">
                    <div className="bg-[#1e1e1e] border border-white/20 rounded-2xl p-3 shadow-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"/>
                            <span className="text-white text-sm">{fmt(callDuration)}</span>
                        </div>
                        
                        <div className="w-48 h-36 bg-black rounded-lg overflow-hidden mb-2">
                            {remoteHasVideo ? (
                                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                    <div className="text-3xl">👤</div>
                                </div>
                            )}
                            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden"/>
                        </div>
                        
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={toggleMute}
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? "bg-red-500" : "bg-gray-600"} text-white`}
                            >
                                {isMuted ? "🔇" : "🎤"}
                            </button>
                            <button
                                onClick={toggleVideo}
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${isVideoOff ? "bg-red-500" : "bg-gray-600"} text-white`}
                            >
                                {isVideoOff ? "📵" : "📹"}
                            </button>
                            <button
                                onClick={endCall}
                                className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white"
                            >
                                📴
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}
