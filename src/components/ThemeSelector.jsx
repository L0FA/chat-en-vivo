import { useState } from "react";
import { useTheme } from "../hooks/useTheme";

const THEME_OPTIONS = [
    { value: "default",    label: "Clásico",    emoji: "💬", bg: "bg-indigo-500" },
    { value: "rosa",       label: "Rosa",       emoji: "🌸", bg: "bg-rose-400" },
    { value: "dark",       label: "Oscuro",     emoji: "🌙", bg: "bg-slate-800" },
    { value: "darkpink",   label: "Dark Pink",  emoji: "💜", bg: "bg-purple-900" },
    { value: "neon",       label: "Neon",       emoji: "⚡", bg: "bg-emerald-900" },
    { value: "cyberpunk",  label: "Cyberpunk",  emoji: "🤖", bg: "bg-fuchsia-900" },
    { value: "matrix",     label: "Matrix",     emoji: "📟", bg: "bg-black" },
    { value: "retro",      label: "Retro",      emoji: "📻", bg: "bg-amber-600" },
    { value: "ocean",      label: "Océano",     emoji: "🌊", bg: "bg-sky-600" },
    { value: "forest",     label: "Bosque",     emoji: "🌲", bg: "bg-green-700" },
    { value: "vaporwave",  label: "Vaporwave",  emoji: "🌴", bg: "bg-violet-600" },
    { value: "galaxy",     label: "Galaxia",    emoji: "🌌", bg: "bg-indigo-900" },
    { value: "minimal",    label: "Minimal",     emoji: "⚪", bg: "bg-slate-100" },
    { value: "fire",       label: "Fuego",      emoji: "🔥", bg: "bg-orange-700" },
];

export default function ThemeSelector({ scrolled }) {
    const { theme, changeTheme } = useTheme();
    const [open, setOpen] = useState(false);

    const current = THEME_OPTIONS.find(t => t.value === theme) || THEME_OPTIONS[0];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                    scrolled 
                    ? "bg-white/80 border-gray-200 text-gray-800 shadow-sm" 
                    : "bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20"
                }`}
            >
                <span className="text-lg">{current.emoji}</span>
                <span className="text-sm font-medium hidden sm:block">{current.label}</span>
                <svg 
                    className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-64 max-h-[70vh] overflow-y-auto z-50 p-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-2xl shadow-2xl animate-fade-in">
                        <div className="grid grid-cols-1 gap-1">
                            {THEME_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        changeTheme(opt.value);
                                        setOpen(false);
                                    }}
                                    className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all duration-200 ${
                                        theme === opt.value 
                                        ? "bg-indigo-600/30 text-white border border-indigo-500/30" 
                                        : "hover:bg-white/5 text-white/70 hover:text-white"
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${opt.bg} shadow-inner`}>
                                        {opt.emoji}
                                    </div>
                                    <span className="text-sm font-medium">{opt.label}</span>
                                    {theme === opt.value && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
