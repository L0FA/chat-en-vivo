import { useState, useEffect } from "react";

export default function SplashScreen() {
    const [visible, setVisible] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => setVisible(false), 500);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999] transition-opacity duration-500 ${
                fadeOut ? "opacity-0" : "opacity-100"
            }`}
            style={{ height: "100dvh" }}
        >
            <div className="text-4xl mb-4">💬</div>
            <h1 className="text-2xl font-bold text-white mb-2">L0FAChat</h1>
            <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}