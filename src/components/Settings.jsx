import { useState, useRef } from "react";
import { createPortal } from "react-dom";

export default function Settings({ open, onClose }) {
    const [ringtone, setRingtone] = useState(() => localStorage.getItem("ringtone-url") || "");
    const [customRingtone, setCustomRingtone] = useState(null);
    const [notificationSound, setNotificationSound] = useState(() => localStorage.getItem("notification-sound") || "default");
    const [typingSound, setTypingSound] = useState(() => localStorage.getItem("typing-sound") || "default");
    const fileInputRef = useRef(null);

    const defaultRingtones = [
        { name: "Classic", url: "https://www.soundjay.com/phone/cell-phone-ringing-01.mp3" },
        { name: "Modern", url: "https://www.soundjay.com/phone/cell-phone-ringing-02.mp3" },
        { name: "Retro", url: "https://www.soundjay.com/phone/cell-phone-ringing-03.mp3" },
    ];

    const notificationOptions = [
        { value: "default", label: "🔔 Default" },
        { value: "ding", label: "🔔 Ding" },
        { value: "chime", label: "🔔 Chime" },
        { value: "pop", label: "🔔 Pop" },
        { value: "none", label: "🔇 Silencio" },
    ];

    const typingOptions = [
        { value: "default", label: "🔔 Default" },
        { value: "soft", label: "🔔 Suave" },
        { value: "click", label: "🔔 Click" },
        { value: "none", label: "🔇 Silencio" },
    ];

    const handleSelectRingtone = (url) => {
        localStorage.setItem("ringtone-url", url);
        setRingtone(url);
        setCustomRingtone(null);
    };

    const handleNotificationChange = (value) => {
        localStorage.setItem("notification-sound", value);
        setNotificationSound(value);
    };

    const handleTypingChange = (value) => {
        localStorage.setItem("typing-sound", value);
        setTypingSound(value);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        localStorage.setItem("ringtone-url", url);
        localStorage.setItem("ringtone-name", file.name);
        setRingtone(url);
        setCustomRingtone(file.name);
    };

    const testRingtone = () => {
        if (ringtone) {
            const audio = new Audio(ringtone);
            audio.play().catch(() => {});
        }
    };

    const clearCustomRingtone = () => {
        localStorage.removeItem("ringtone-url");
        localStorage.removeItem("ringtone-name");
        setRingtone("");
        setCustomRingtone(null);
    };

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70" onClick={onClose}>
            <div 
                className="bg-[#1e1e1e] border border-white/20 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white font-bold text-xl">⚙️ Configuración</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
                </div>

                <div className="space-y-6">
                    {/* Ringtone */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">🔔</span>
                            <span className="text-white font-medium">Ringtone de llamada</span>
                        </div>
                        
                        <div className="text-white/60 text-xs mb-3">Selecciona un tono:</div>
                        <div className="flex flex-col gap-2">
                            {defaultRingtones.map((r) => (
                                <button
                                    key={r.url}
                                    onClick={() => handleSelectRingtone(r.url)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                                        ringtone === r.url ? "bg-pink-500/20 border border-pink-500" : "bg-white/5 hover:bg-white/10"
                                    }`}
                                >
                                    <span className="text-white text-sm">{r.name}</span>
                                    {ringtone === r.url && <span className="text-pink-400">✓</span>}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4">
                            <div className="text-white/60 text-xs mb-2">O sube tu propio archivo (MP3/WAV):</div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="audio/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 rounded-lg transition"
                            >
                                📁 Subir archivo
                            </button>
                            {customRingtone && (
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-white/80 text-sm truncate">🎵 {customRingtone}</span>
                                    <button onClick={clearCustomRingtone} className="text-red-400 text-xs">✕</button>
                                </div>
                            )}
                        </div>

                        {ringtone && (
                            <button
                                onClick={testRingtone}
                                className="mt-3 w-full bg-green-600 hover:bg-green-500 text-white text-sm px-3 py-2 rounded-lg transition"
                            >
                                🔊 Probar ringtone
                            </button>
                        )}
                    </div>

                    {/* Notificación */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">💬</span>
                            <span className="text-white font-medium">Sonido de mensaje</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {notificationOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleNotificationChange(opt.value)}
                                    className={`text-xs px-2 py-2 rounded-lg transition cursor-pointer ${
                                        notificationSound === opt.value
                                            ? "bg-pink-500/50 border border-pink-400"
                                            : "bg-white/10 border border-transparent hover:bg-white/20"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Typing */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">⌨️</span>
                            <span className="text-white font-medium">Sonido de escritura</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {typingOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleTypingChange(opt.value)}
                                    className={`text-xs px-2 py-2 rounded-lg transition cursor-pointer ${
                                        typingSound === opt.value
                                            ? "bg-pink-500/50 border border-pink-400"
                                            : "bg-white/10 border border-transparent hover:bg-white/20"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-bold"
                >
                    ✓ Listo
                </button>
            </div>
        </div>,
        document.body
    );
}
