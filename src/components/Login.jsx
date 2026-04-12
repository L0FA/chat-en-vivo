import { useState } from "react";
import { useChat } from "../hooks/useChat";

export default function Login() {
    const { login } = useChat();
    const [input, setInput] = useState(() => localStorage.getItem("NombreUsuario") || "");

    const handleSubmit = (e) => {
        e.preventDefault();
        const nombre = input.trim() || "Anonimo";
        login(nombre);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col gap-4 w-full max-w-sm shadow-2xl">
                <h2 className="text-xl font-bold text-center text-gray-800">
                    💬 Whatsappn't
                </h2>
                <p className="text-sm text-gray-500 text-center">
                    Ingresá tu nombre para entrar al chat
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Tu nombre..."
                        autoFocus
                        className="border border-gray-200 rounded-xl px-4 py-2 text-base sm:text-sm focus:outline-none focus:border-pink-400 transition w-full"
                    />
                    <button
                        type="submit"
                        className="bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 rounded-xl transition"
                    >
                        Entrar →
                    </button>
                </form>
            </div>
        </div>
    );
}
