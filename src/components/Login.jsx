import { useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";

const ADMIN_USERS = ["Testing", "La Compu Del Admin", "El Celu Del Admin", "Anonimo", "Wachin", "usuariorosa"];

export default function Login() {
    const { login, user } = useChat();
    const [input, setInput] = useState(() => localStorage.getItem("NombreUsuario") || "");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("RememberMe") === "true");
    const [isAdmin, setIsAdmin] = useState(false);
    
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInput(value);
        setIsAdmin(ADMIN_USERS.includes(value.trim()));
    };

    // useEffect 1 - auto login
    useEffect(() => {
        if (typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;
        if (rememberMe && localStorage.getItem("NombreUsuario")) {
            const savedPassword = localStorage.getItem("UserPassword") || "";
            login(localStorage.getItem("NombreUsuario"), savedPassword);
        }
    }, [login, rememberMe]);

    // useEffect 2 - cleanup on unload
    useEffect(() => {
        if (typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;
        const handleBeforeUnload = () => {
            if (!rememberMe) {
                localStorage.removeItem("NombreUsuario");
                localStorage.removeItem("UserPassword");
                localStorage.removeItem("RememberMe");
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [rememberMe]);

    // useEffect 3 - clear storage if not remembering
    useEffect(() => {
        if (typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;
        if (!rememberMe) {
            localStorage.removeItem("NombreUsuario");
            localStorage.removeItem("UserPassword");
        }
    }, [rememberMe]);

    // Return early AFTER all hooks
    if (user) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const nombre = input.trim() || "Invitado";
        
        if (rememberMe) {
            localStorage.setItem("RememberMe", "true");
            localStorage.setItem("NombreUsuario", nombre);
            localStorage.setItem("UserPassword", password);
        } else {
            localStorage.setItem("RememberMe", "false");
            localStorage.removeItem("NombreUsuario");
            localStorage.removeItem("UserPassword");
        }
        
        login(nombre, password);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" style={{ height: "100dvh" }}>
            <div className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col gap-4 w-full max-w-sm shadow-2xl">
                <h2 className="text-xl font-bold text-center text-gray-800">💬 L0FAChat</h2>
                <p className="text-sm text-gray-500 text-center">Ingresá tu nombre para entrar al chat</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Tu nombre..."
                        autoFocus
                        className="border border-gray-200 rounded-xl px-4 py-2 text-base sm:text-sm focus:outline-none focus:border-pink-400 transition w-full bg-white text-gray-900"
                    />
                    {isAdmin && (
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Contraseña de admin..."
                            className="border border-gray-200 rounded-xl px-4 py-2 text-base sm:text-sm focus:outline-none focus:border-pink-400 transition w-full bg-white text-gray-900"
                        />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-pink-400 rounded"
                        />
                        <span className="text-sm text-gray-600">Recordar sesión</span>
                    </label>
                    <button type="submit" className="bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 rounded-xl transition">
                        Entrar →
                    </button>
                </form>
            </div>
        </div>
    );
}