import { useState, useEffect, useRef } from "react";

const PARTICLES = ["✨", "⭐", "🌟", "💫", "💠"];

export default function SplashScreen() {
    const [visible, setVisible] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);
    const [progress, setProgress] = useState(0);
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = Array.from({ length: 20 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 8 + Math.random() * 12,
            speed: 0.2 + Math.random() * 0.5,
            wobble: Math.random() * Math.PI * 2,
            emoji: PARTICLES[Math.floor(Math.random() * PARTICLES.length)]
        }));

        let animId;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.y -= p.speed;
                p.wobble += 0.01;
                p.x += Math.sin(p.wobble) * 0.3;

                if (p.y < -20) {
                    p.y = canvas.height + 20;
                    p.x = Math.random() * canvas.width;
                }

                ctx.font = `${p.size}px serif`;
                ctx.globalAlpha = 0.3 + (p.y / canvas.height) * 0.4;
                ctx.fillText(p.emoji, p.x, p.y);
            });
            ctx.globalAlpha = 1;
            animId = requestAnimationFrame(animate);
        };
        animate();

        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return p + Math.random() * 15 + 5;
            });
        }, 150);

        const timer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => setVisible(false), 500);
        }, 2000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
            cancelAnimationFrame(animId);
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 bg-black flex flex-col items-center justify-center z-9999 transition-opacity duration-500 ${
                fadeOut ? "opacity-0" : "opacity-100"
            }`}
            style={{ height: "100dvh" }}
        >
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="text-5xl mb-4 animate-bounce">💬</div>
                <h1 className="text-3xl font-bold text-white mb-6">L0FAChat</h1>
                
                <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mb-6">
                    <div 
                        className="h-full bg-pink-400 transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
                
                <p className="text-white/40 text-xs">
                    © 2025 L0FAChat. Todos los derechos reservados.
                </p>
                <p className="text-white/20 text-[10px] mt-1">
                    Version 1.0.0
                </p>
            </div>
        </div>
    );
}