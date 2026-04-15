// ============================================
// 📞 ACTIVE CALL PANEL - Panel de llamada activa
// Muestra video remoto, preview local, controles de mute/video/end
// Incluye fullscreen, screen share y panel arrastrable
// Archivo: src/components/call/ActiveCallPanel.jsx
// ============================================

import { useChat } from "../../hooks/useChat";

/**
 * Panel de llamada activa ( minimized o fullscreen )
 * @param {Object} props
 * @param {string} props.remoteUser - Usuario remoto
 * @param {string} props.callType - "audio" | "video"
 * @param {number} props.callDuration - Duración en segundos
 * @param {boolean} props.isFullscreen - Si está en fullscreen
 * @param {boolean} props.isMuted - Si el micrófono está muteado
 * @param {boolean} props.isVideoOff - Si el video está apagado
 * @param {boolean} props.isScreenSharing - Si está compartiendo pantalla
 * @param {boolean} props.isDragging - Si está arrastrando
 * @param {Object} props.position - { x, y } posición del panel
 * @param {React.ref} props.remoteVideoRef - Ref del video remoto
 * @param {React.ref} props.localVideoRef - Ref del video local
 * @param {function} props.onToggleMute - Toggle mute
 * @param {function} props.onToggleVideo - Toggle video
 * @param {function} props.onEndCall - Terminar llamada
 * @param {function} props.onToggleFullscreen - Toggle fullscreen
 * @param {function} props.onToggleScreenShare - Toggle screen share
 * @param {function} props.onDragStart - Iniciar drag
 * @param {function} props.onDrag - Drag
 * @param {function} props.onDragEnd - Fin drag
 */
export default function ActiveCallPanel({
    remoteUser,
    callType,
    callDuration,
    isFullscreen,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isDragging,
    position,
    remoteVideoRef,
    localVideoRef,
    remoteHasVideo,
    onToggleMute,
    onToggleVideo,
    onEndCall,
    onToggleFullscreen,
    onToggleScreenShare,
    onDragStart,
    onDrag,
    onDragEnd
}) {
    const { connectedUsers } = useChat();

    // Formatear duración
    const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    // Obtener avatar del usuario remoto
    const getRemoteAvatar = () => {
        const remote = connectedUsers.find(u => {
            const nombre = typeof u === "string" ? u : u?.nombre;
            return nombre === remoteUser;
        });
        const avatar = remote?.avatar;
        return avatar && avatar.startsWith("data:image") ? avatar : null;
    };

    const remoteAvatar = getRemoteAvatar();

    return (
        <div 
            className={`fixed z-40 transition-all ${isDragging ? 'transition-none' : ''} ${isFullscreen ? 'inset-0' : ''}`}
            style={!isFullscreen ? { 
                right: `${position.x}%`, 
                bottom: `${position.y}%`,
                transition: isDragging ? 'none' : 'all 0.3s ease'
            } : {}}
            onMouseDown={onDragStart}
            onMouseMove={onDrag}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchStart={onDragStart}
            onTouchMove={onDrag}
            onTouchEnd={onDragEnd}
        >
            <div className={`bg-[#1e1e1e] border border-white/20 rounded-2xl p-3 shadow-xl ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"/>
                        <span className="text-white text-sm">{remoteUser}</span>
                        <span className="text-white/50 text-xs">• {fmt(callDuration)}</span>
                    </div>
                    
                    {/* Botón screen share (solo video) */}
                    {callType === "video" && (
                        <button
                            onClick={onToggleScreenShare}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isScreenSharing ? "bg-green-500" : "bg-white/10 hover:bg-white/20"}`}
                            title={isScreenSharing ? "Dejar de compartir" : "Compartir pantalla"}
                        >
                            🖥️
                        </button>
                    )}
                    
                    {/* Botón fullscreen */}
                    <button
                        onClick={onToggleFullscreen}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
                        title={isFullscreen ? "Minimizar" : "Fullscreen"}
                    >
                        {isFullscreen ? "🔲" : "⛶"}
                    </button>
                </div>
                
                {/* Video area */}
                <div className={`bg-black rounded-lg overflow-hidden mb-2 relative ${isFullscreen ? 'flex-1' : 'w-48 h-36'}`}>
                    {/* Video/Avatar remoto */}
                    {remoteHasVideo ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            {remoteAvatar ? (
                                <img src={remoteAvatar} alt="" className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                                <div className="text-5xl">👤</div>
                            )}
                        </div>
                    )}
                    
                    {/* Preview local (solo si video no está apagado) */}
                    {!isVideoOff && (
                        <div className="absolute bottom-1 right-1 w-12 h-9 bg-black rounded overflow-hidden">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
                        </div>
                    )}
                </div>
                
                {/* Controles */}
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={onToggleMute}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? "bg-red-500" : "bg-gray-600"} text-white`}
                    >
                        {isMuted ? "🔇" : "🎤"}
                    </button>
                    
                    <button
                        onClick={onToggleVideo}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isVideoOff ? "bg-red-500" : "bg-gray-600"} text-white`}
                    >
                        {isVideoOff ? "📵" : "📹"}
                    </button>
                    
                    <button
                        onClick={onEndCall}
                        className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white"
                    >
                        📴
                    </button>
                </div>
            </div>
        </div>
    );
}