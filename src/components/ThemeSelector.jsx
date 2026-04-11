import { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";

const THEME_OPTIONS = [
    { value: "default",    label: "Default",    emoji: "💬", bg: "#ff69b4", text: "white" },
    { value: "rosa",       label: "Rosa",        emoji: "🌸", bg: "#ffb6c1", text: "#4b004b" },
    { value: "dark",       label: "Dark",        emoji: "🌑", bg: "#222",    text: "white" },
    { value: "darkpink",   label: "Dark Pink",   emoji: "💜", bg: "#a00055", text: "white" },
    { value: "neon",       label: "Neon",        emoji: "⚡", bg: "#0f0f23", text: "#00ff88" },
    { value: "cyberpunk",  label: "Cyberpunk",   emoji: "🤖", bg: "#1a0033", text: "#ff0080" },
    { value: "matrix",     label: "Matrix",      emoji: "🟢", bg: "#000",    text: "#00ff00" },
    { value: "retro",      label: "Retro",       emoji: "📼", bg: "#ff6b35", text: "#2d1b69" },
    { value: "ocean",      label: "Ocean",       emoji: "🌊", bg: "#0077be", text: "white" },
    { value: "forest",     label: "Forest",      emoji: "🌲", bg: "#228b22", text: "white" },
    { value: "vaporwave",  label: "Vaporwave",   emoji: "🌴", bg: "#ff71ce", text: "white" },
    { value: "galaxy",     label: "Galaxy",      emoji: "🌌", bg: "#4b0082", text: "white" },
    { value: "minimal",    label: "Minimal",     emoji: "⚪", bg: "#f5f5f5", text: "#333" },
    { value: "fire",       label: "Fire",        emoji: "🔥", bg: "#ff4500", text: "white" },
];

export default function ThemeSelector({ scrolled }) {
    const { theme, changeTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const current = THEME_OPTIONS.find(t => t.value === theme) || THEME_OPTIONS[0];

    // Manejar fade in/out
    useEffect(() => {
    if (open) {
        setTimeout(() => setVisible(true), 0);
    }
}, [open]);

    const handleClose = () => {
        // Primero fade out, luego desmontar
        setVisible(false);
        setTimeout(() => setOpen(false), 200);
    };

    const handleSelect = (value) => {
        changeTheme(value);
        handleClose();
    };

    return (
        <div className="relative">
            <button
                onClick={() => open ? handleClose() : setOpen(true)}
                style={{ background: scrolled ? current.bg : "rgba(255,255,255,0.2)", color: scrolled ? current.text : "white" }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold shadow-md hover:scale-105 transition border border-white/20 cursor-pointer backdrop-blur-sm"
            >
                <span>{current.emoji}</span>
                <span className="hidden sm:inline">{current.label}</span>
                <span className="text-xs opacity-70">{open ? "▲" : "▼"}</span>
            </button>

            {/* Panel con fade */}
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={handleClose} />
                    <div
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
                            transition: "opacity 0.2s ease, transform 0.2s ease"
                        }}
                        className="absolute top-10 right-0 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl w-72"
                    >
                        <p className="text-white text-xs font-bold mb-2 px-1 drop-shadow">🎨 Elegí tu tema</p>
                        <div className="grid grid-cols-3 gap-2">
                            {THEME_OPTIONS.map((t, i) => (
                                <button
                                    key={t.value}
                                    onClick={() => handleSelect(t.value)}
                                    style={{
                                        background: t.bg,
                                        color: t.text,
                                        opacity: visible ? 1 : 0,
                                        transform: visible ? "translateY(0)" : "translateY(6px)",
                                        transition: `opacity 0.2s ease ${i * 0.02}s, transform 0.2s ease ${i * 0.02}s`
                                    }}
                                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-bold shadow-md border-2 hover:scale-105 transition-transform cursor-pointer ${
                                    theme === t.value
                                    ? "border-white scale-105 shadow-lg"
                                    : "border-transparent"
}`}
                                >
                                    <span className="text-xl">{t.emoji}</span>
                                    <span className="leading-tight text-center">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}