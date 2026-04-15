// ============================================
// 📞 INCOMING CALL MODAL - Popup de llamada entrante
// Muestra el usuario que llama con opciones de aceptar/rechazar
// Archivo: src/components/call/IncomingCallModal.jsx
// ============================================

import { useChat } from "../../hooks/useChat";

/**
 * Modal de llamada entrante
 * @param {Object} incomingCall - { from: string, type: "audio"|"video" }
 * @param {function} onAccept - Aceptar llamada
 * @param {function} onReject - Rechazar llamada
 * @param {React.ref} ringtoneRef - Referencia al audio del ringtone
 */
export default function IncomingCallModal({ incomingCall, onAccept, onReject, ringtoneRef }) {
    const { connectedUsers } = useChat();

    if (!incomingCall) return null;

    const remote = connectedUsers.find(u => {
        const nombre = typeof u === "string" ? u : u?.nombre;
        return nombre === incomingCall.from;
    });
    
    const avatar = remote?.avatar;
    const isImage = avatar && avatar.startsWith("data:image");

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
            <div className="bg-[#1e1e1e] border border-white/20 p-8 rounded-3xl text-center shadow-2xl animate-scale-in">
                {isImage ? (
                    <img src={avatar} alt="" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow-lg" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-pink-400 flex items-center justify-center text-5xl mx-auto mb-4">👤</div>
                )}
                
                <div className="text-white font-bold text-xl mb-1">{incomingCall.from}</div>
                <p className="text-white/50 text-sm mb-6">
                    {incomingCall.type === "video" ? "📹 Te llama" : "🎤 Te llama"}
                </p>
                
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={onAccept} 
                        className="bg-green-500 hover:bg-green-600 w-14 h-14 rounded-full flex items-center justify-center text-2xl animate-bounce"
                    >
                        📞
                    </button>
                    <button 
                        onClick={onReject} 
                        className="bg-red-500 hover:bg-red-600 w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    >
                        📴
                    </button>
                </div>
            </div>
            <audio ref={ringtoneRef} loop />
        </div>
    );
}