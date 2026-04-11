import { useEffect } from "react";

export default function Lightbox({ src, onClose }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/92 z-200 flex items-center justify-center animate-fadeIn"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-5 text-white text-3xl bg-none border-none cursor-pointer hover:scale-125 transition"
            >
                ✖
            </button>
            <img
                src={src}
                onClick={e => e.stopPropagation()}
                className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain shadow-2xl animate-zoomIn"
                alt="imagen ampliada"
            />
        </div>
    );
}