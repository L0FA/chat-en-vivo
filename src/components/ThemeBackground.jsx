import { useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";

export default function ThemeBackground() {
    const { theme } = useChat();
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);

        cancelAnimationFrame(animFrameRef.current);

        // Limpiar antes de arrancar
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let particles = [];
        let animate;

        switch (theme) {
            case "rosa":
            case "darkpink": {
                // Pétalos cayendo
                const PETALS = ["🌸", "🌺", "🌹", "💮"];
                particles = Array.from({ length: 40 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: 14 + Math.random() * 12,
                    speed: 0.5 + Math.random() * 1.5,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.02 + Math.random() * 0.03,
                    emoji: PETALS[Math.floor(Math.random() * PETALS.length)]
                }));
                animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.y += p.speed;
                        p.wobble += p.wobbleSpeed;
                        p.x += Math.sin(p.wobble) * 0.8;
                        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
                        ctx.font = `${p.size}px serif`;
                        ctx.globalAlpha = 0.7;
                        ctx.fillText(p.emoji, p.x, p.y);
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "dark": {
                // Estrellas parpadeando
                particles = Array.from({ length: 80 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: 0.5 + Math.random() * 2,
                    alpha: Math.random(),
                    speed: 0.005 + Math.random() * 0.02,
                    dir: Math.random() > 0.5 ? 1 : -1
                }));
                animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.alpha += p.speed * p.dir;
                        if (p.alpha >= 1 || p.alpha <= 0) p.dir *= -1;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
                        ctx.fill();
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "matrix": {
                // Lluvia de código
                const cols = Math.floor(canvas.width / 16);
                const drops = Array.from({ length: cols }, () => Math.random() * -100);
                const chars = "アイウエオカキクケコ01アイウエオ10MATRIX";
                animate = () => {
                    ctx.fillStyle = "rgba(0,0,0,0.05)";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "#00ff00";
                    ctx.font = "14px monospace";
                    drops.forEach((y, i) => {
                        const char = chars[Math.floor(Math.random() * chars.length)];
                        ctx.fillStyle = `rgba(0,${150 + Math.floor(Math.random() * 105)},0,0.8)`;
                        ctx.fillText(char, i * 16, y * 16);
                        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                        drops[i]++;
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "neon": {
                // Partículas de neón flotando
                particles = Array.from({ length: 50 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: 2 + Math.random() * 4,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: (Math.random() - 0.5) * 0.8,
                    hue: Math.random() * 120 + 120
                }));
                animate = () => {
                    ctx.fillStyle = "rgba(15,15,35,0.15)";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.x += p.vx;
                        p.y += p.vy;
                        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fillStyle = `hsla(${p.hue},100%,60%,0.8)`;
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = `hsla(${p.hue},100%,60%,1)`;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "cyberpunk": {
                // Líneas de circuito animadas
                particles = Array.from({ length: 20 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    length: 50 + Math.random() * 150,
                    speed: 1 + Math.random() * 3,
                    dir: Math.random() > 0.5 ? "h" : "v",
                    alpha: 0,
                    fadeIn: true
                }));
                animate = () => {
                    ctx.fillStyle = "rgba(13,0,26,0.1)";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.alpha += p.fadeIn ? 0.02 : -0.02;
                        if (p.alpha >= 1) p.fadeIn = false;
                        if (p.alpha <= 0) {
                            p.fadeIn = true;
                            p.x = Math.random() * canvas.width;
                            p.y = Math.random() * canvas.height;
                        }
                        ctx.strokeStyle = `rgba(255,0,128,${p.alpha})`;
                        ctx.lineWidth = 1.5;
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = "#ff0080";
                        ctx.beginPath();
                        if (p.dir === "h") {
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p.x + p.length, p.y);
                        } else {
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p.x, p.y + p.length);
                        }
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "fire": {
                // Partículas de fuego
                particles = Array.from({ length: 80 }, () => ({
                    x: Math.random() * canvas.width,
                    y: canvas.height + Math.random() * 100,
                    size: 3 + Math.random() * 8,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -(1 + Math.random() * 3),
                    life: Math.random(),
                    decay: 0.005 + Math.random() * 0.015
                }));
                animate = () => {
                    ctx.fillStyle = "rgba(0,0,0,0.1)";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.life -= p.decay;
                        p.x += p.vx;
                        p.y += p.vy;
                        p.size *= 0.99;
                        if (p.life <= 0) {
                            p.x = Math.random() * canvas.width;
                            p.y = canvas.height + 10;
                            p.life = 1;
                            p.size = 3 + Math.random() * 8;
                            p.vy = -(1 + Math.random() * 3);
                        }
                        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                        gradient.addColorStop(0, `rgba(255,255,100,${p.life})`);
                        gradient.addColorStop(0.4, `rgba(255,100,0,${p.life * 0.8})`);
                        gradient.addColorStop(1, `rgba(255,0,0,0)`);
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fillStyle = gradient;
                        ctx.fill();
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "ocean": {
                // Burbujas subiendo
                particles = Array.from({ length: 40 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: 3 + Math.random() * 12,
                    speed: 0.3 + Math.random() * 1,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.02 + Math.random() * 0.03
                }));
                animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.y -= p.speed;
                        p.wobble += p.wobbleSpeed;
                        p.x += Math.sin(p.wobble) * 0.5;
                        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(255,255,255,0.3)`;
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        ctx.fillStyle = `rgba(255,255,255,0.05)`;
                        ctx.fill();
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "forest": {
                // Hojas cayendo
                const LEAVES = ["🍃", "🍀", "🌿", "🍂"];
                particles = Array.from({ length: 30 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: 12 + Math.random() * 10,
                    speed: 0.4 + Math.random() * 1.2,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.015 + Math.random() * 0.025,
                    emoji: LEAVES[Math.floor(Math.random() * LEAVES.length)]
                }));
                animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.y += p.speed;
                        p.wobble += p.wobbleSpeed;
                        p.x += Math.sin(p.wobble) * 1.2;
                        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
                        ctx.font = `${p.size}px serif`;
                        ctx.globalAlpha = 0.75;
                        ctx.fillText(p.emoji, p.x, p.y);
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "galaxy": {
                // Estrellas y nebulosas
                particles = Array.from({ length: 100 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: 0.5 + Math.random() * 3,
                    alpha: Math.random(),
                    speed: 0.003 + Math.random() * 0.01,
                    dir: Math.random() > 0.5 ? 1 : -1,
                    hue: Math.random() * 60 + 240
                }));
                animate = () => {
                    ctx.fillStyle = "rgba(0,0,0,0.05)";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.alpha += p.speed * p.dir;
                        if (p.alpha >= 1 || p.alpha <= 0) p.dir *= -1;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fillStyle = `hsla(${p.hue},80%,80%,${p.alpha})`;
                        ctx.shadowBlur = p.size > 2 ? 6 : 0;
                        ctx.shadowColor = `hsla(${p.hue},100%,80%,1)`;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "vaporwave": {
                // Grid retro + sol
                let offset = 0;
                animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    offset = (offset + 0.5) % 60;

                    // Sol
                    const cx = canvas.width / 2;
                    const cy = canvas.height * 0.4;
                    const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
                    gradient.addColorStop(0, "rgba(255,200,0,0.9)");
                    gradient.addColorStop(0.5, "rgba(255,100,150,0.6)");
                    gradient.addColorStop(1, "rgba(255,100,150,0)");
                    ctx.beginPath();
                    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    // Grid
                    ctx.strokeStyle = "rgba(255,100,200,0.3)";
                    ctx.lineWidth = 1;
                    for (let x = 0; x < canvas.width; x += 60) {
                        ctx.beginPath();
                        ctx.moveTo(x, canvas.height * 0.5);
                        ctx.lineTo(cx, canvas.height);
                        ctx.stroke();
                    }
                    for (let y = 0; y < 10; y++) {
                        const yPos = canvas.height * 0.5 + (y * 30 + offset) * (1 + y * 0.3);
                        if (yPos > canvas.height) continue;
                        ctx.beginPath();
                        ctx.moveTo(0, yPos);
                        ctx.lineTo(canvas.width, yPos);
                        ctx.stroke();
                    }
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "retro": {
                // Scanlines + ruido
                let frame = 0;
                animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    frame++;
                    // Scanlines
                    for (let y = 0; y < canvas.height; y += 4) {
                        ctx.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.02})`;
                        ctx.fillRect(0, y, canvas.width, 2);
                    }
                    // Ruido ocasional
                    if (frame % 3 === 0) {
                        for (let i = 0; i < 20; i++) {
                            const x = Math.random() * canvas.width;
                            const y = Math.random() * canvas.height;
                            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
                            ctx.fillRect(x, y, 2 + Math.random() * 30, 1);
                        }
                    }
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            case "minimal": {
                // Círculos minimalistas flotando
                particles = Array.from({ length: 8 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: 30 + Math.random() * 80,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    alpha: 0.03 + Math.random() * 0.05
                }));
                animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.x += p.vx;
                        p.y += p.vy;
                        if (p.x < -p.size) p.x = canvas.width + p.size;
                        if (p.x > canvas.width + p.size) p.x = -p.size;
                        if (p.y < -p.size) p.y = canvas.height + p.size;
                        if (p.y > canvas.height + p.size) p.y = -p.size;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.strokeStyle = `rgba(0,0,0,${p.alpha})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }

            default: {
                // Default — partículas suaves
                particles = Array.from({ length: 30 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: 2 + Math.random() * 4,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    alpha: 0.1 + Math.random() * 0.2
                }));
                animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.x += p.vx;
                        p.y += p.vy;
                        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255,105,180,${p.alpha})`;
                        ctx.fill();
                    });
                    animFrameRef.current = requestAnimationFrame(animate);
                };
                break;
            }
        }

        if (animate) animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener("resize", resize);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, [theme]);

    return (
    <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ opacity: 0.6, zIndex: -1 }}
    />
);
}