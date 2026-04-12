import { useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";

export default function ThemeBackground() {
    const { theme } = useChat();
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const intensityRef = useRef(0);

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

        const increaseFire = () => {
            intensityRef.current = Math.min(intensityRef.current + 0.2, 2);
        };

        window.addEventListener("user-typing", increaseFire);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let particles = [];
        let animate;

        switch (theme) {

case "rosa": {

    // 🌸 Pétalos flotando
    const PETALS = ["🌸", "🌺", "🌹", "💮"];

    particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 14 + Math.random() * 12,
        speed: 0.5 + Math.random() * 1.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        rotationOffset: Math.random() * Math.PI,
        emoji: PETALS[Math.floor(Math.random() * PETALS.length)]
    }));

    animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {

            // Movimiento
            p.y += p.speed;
            p.wobble += p.wobbleSpeed;
            p.x += Math.sin(p.wobble) * (0.5 + p.size * 0.02);

            // Respawn natural
            if (p.y > canvas.height) {
                p.y = -20 - Math.random() * 100;
                p.x = Math.random() * canvas.width;
            }

            // Estilo
            ctx.font = `${p.size}px serif`;

            // Alpha dinámico (respira)
            ctx.globalAlpha = 0.6 + Math.sin(p.y * 0.05) * 0.2;

            // Transformación (rotación orgánica)
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.sin(p.wobble + p.rotationOffset) * 0.3);

            ctx.fillText(p.emoji, 0, 0);

            ctx.restore();
        });

        // 🔥 IMPORTANTE: reset
        ctx.globalAlpha = 1;

        animFrameRef.current = requestAnimationFrame(animate);
    };

    break;
}




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
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);

    const chars = "アイウエオカキクケコ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const drops = Array.from({ length: columns }, (_, i) => ({
        y: Math.random() * -100,
        speed: 1 + Math.random() * 2,
        length: 15 + Math.random() * 35,
        x: i * fontSize,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random(),
    }));

    let frame = 0;

    // 🧍 Silueta (centro pantalla)
    const silhouette = (x, y) => {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        const dx = (x - cx) / 120;
        const dy = (y - cy) / 180;

        // cabeza
        const head = dx * dx + (dy + 0.8) * (dy + 0.8) < 0.15;

        // torso
        const body = Math.abs(dx) < 0.3 && dy > -0.5 && dy < 0.6;

        // hombros
        const shoulders = Math.abs(dx) < 0.6 && dy > -0.3 && dy < 0;

        return head || body || shoulders;
    };

    // 🧠 Texto oculto
    const hiddenTexts = ["WAKE UP", "FOLLOW THE WHITE RABBIT", "SYSTEM FAILURE"];

    animate = () => {
        frame++;

        ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${fontSize}px monospace`;

        drops.forEach(drop => {

            const wave = Math.sin(frame * 0.02 + drop.phase) * 10 * drop.depth;

            for (let i = 0; i < drop.length; i++) {
                let char = chars[Math.floor(Math.random() * chars.length)];

                const y = (drop.y - i) * fontSize;
                const x = drop.x + wave;

                const alpha = 1 - i / drop.length;

                let brightnessBoost = 0;

                // 🧍 SILUETA BOOST
                if (silhouette(x, y)) {
                    brightnessBoost = 0.8;
                }

                // 🧠 TEXTO OCULTO
                const textIndex = Math.floor(frame / 600) % hiddenTexts.length;
                const text = hiddenTexts[textIndex];

                const textX = canvas.width / 2 - (text.length * fontSize) / 2;
                const textY = canvas.height * 0.75;

                const charIndex = Math.floor((x - textX) / fontSize);

                if (
                    y > textY - 20 &&
                    y < textY + 20 &&
                    charIndex >= 0 &&
                    charIndex < text.length
                ) {
                    char = text[charIndex];
                    brightnessBoost = 1;
                }

                // HEAD
                if (i === 0) {
                    ctx.fillStyle = `rgba(200,255,200,${1 + brightnessBoost})`;
                    ctx.shadowBlur = 20 + brightnessBoost * 20;
                    ctx.shadowColor = "#00ffcc";
                } else {
                    ctx.fillStyle = `rgba(0,255,120,${alpha * (0.7 + brightnessBoost)})`;
                    ctx.shadowBlur = 0;
                }

                ctx.fillText(char, x, y);
            }

            drop.y += drop.speed;

            if (drop.y * fontSize > canvas.height && Math.random() > 0.97) {
                drop.y = Math.random() * -50;
                drop.speed = 1 + Math.random() * 2;
                drop.length = 15 + Math.random() * 35;
                drop.phase = Math.random() * Math.PI * 2;
            }
        });

        // ⚡ GLITCH
        if (frame % 120 === 0) {
            const y = Math.random() * canvas.height;
            const h = 10 + Math.random() * 20;

            ctx.globalAlpha = 0.2;
            ctx.drawImage(
                canvas,
                0, y,
                canvas.width, h,
                (Math.random() - 0.5) * 30, y,
                canvas.width, h
            );
            ctx.globalAlpha = 1;
        }

        // ✨ FLASH
        if (Math.random() < 0.0015) {
            ctx.fillStyle = "rgba(0,255,150,0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

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

                    // NODOS
                    particles.forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(255,0,128,0.25)";
                        ctx.shadowBlur = 6;
                        ctx.shadowColor = "#ff0080";
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    });

                    // LÍNEAS
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
    const fireParticles = Array.from({ length: 130 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        size: 4 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(2 + Math.random() * 4),
        life: 0.8 + Math.random() * 0.5,
        decay: 0.008 + Math.random() * 0.02
    }));

    const smokeParticles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height,
        size: 10 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.5 + Math.random() * 1),
        alpha: 0.2 + Math.random() * 0.3,
        decay: 0.002 + Math.random() * 0.004
    }));

    const embers = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height,
        size: 1 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 2,
        vy: -(1 + Math.random() * 3),
        life: 0.5 + Math.random() * 0.5,
        decay: 0.01 + Math.random() * 0.02
    }));

    let wind = 0;

    animate = () => {
        // Fade general
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        wind += 0.01;

        // 🔥 FIRE
        fireParticles.forEach(p => {
            p.life -= p.decay;
            p.x += p.vx + Math.sin(wind + p.y * 0.01) * 0.3;
            p.y += p.vy;
            p.size *= 1.01;

            if (p.life <= 0 || p.y < canvas.height * 0.25) {
                p.x = Math.random() * canvas.width;
                p.y = canvas.height + Math.random() * 100;
                p.life = 1;
                p.size = 4 + Math.random() * 10;
                p.vy = -(2 + Math.random() * 4);
            }

            const gradient = ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.size * 2
            );

            gradient.addColorStop(0, `rgba(255,255,180,${p.life})`);
            gradient.addColorStop(0.3, `rgba(255,150,0,${p.life * 0.9})`);
            gradient.addColorStop(0.6, `rgba(255,60,0,${p.life * 0.7})`);
            gradient.addColorStop(1, `rgba(0,0,0,0)`);

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });

        // 💨 SMOKE
        smokeParticles.forEach(s => {
            s.y += s.vy;
            s.x += s.vx + Math.sin(wind + s.y * 0.02) * 0.2;
            s.alpha -= s.decay;
            s.size *= 1.01;

            if (s.alpha <= 0 || s.y < canvas.height * 0.2) {
                s.x = Math.random() * canvas.width;
                s.y = canvas.height;
                s.alpha = 0.3;
                s.size = 10 + Math.random() * 20;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(120,120,120,${s.alpha})`;
            ctx.fill();
        });

        // ✨ EMBERS (chispas)
        embers.forEach(e => {
            e.life -= e.decay;
            e.x += e.vx + Math.sin(wind + e.y * 0.03);
            e.y += e.vy;

            if (e.life <= 0 || e.y < canvas.height * 0.2) {
                e.x = Math.random() * canvas.width;
                e.y = canvas.height;
                e.life = 1;
            }

            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,200,100,${e.life})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "orange";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 🔥 BASE GLOW (brasas abajo)
        const baseGradient = ctx.createLinearGradient(0, canvas.height * 0.8, 0, canvas.height);
        baseGradient.addColorStop(0, "rgba(255,80,0,0)");
        baseGradient.addColorStop(1, "rgba(255,80,0,0.25)");

        ctx.fillStyle = baseGradient;
        ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);

        animFrameRef.current = requestAnimationFrame(animate);
    };

    break;
}





case "ocean": {
    particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 4,
        depth: Math.random(),
        speedY: 0.2 + Math.random() * 0.6,
        speedX: (Math.random() - 0.5) * 0.3,
        alpha: 0.2 + Math.random() * 0.4
    }));

    // 🐟 peces mejorados con profundidad
    const fish = Array.from({ length: 6 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        speed: 0.3 + Math.random() * 0.8,
        size: 30 + Math.random() * 70,
        dir: Math.random() > 0.5 ? 1 : -1,
        depth: Math.random(),
        wiggle: Math.random() * Math.PI * 2
    }));

    const drawFish = (f) => {
        const scale = 0.5 + f.depth; // parallax tamaño
        const width = f.size * scale;
        const height = width * 0.4;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.dir, 1);

        // 🐟 cuerpo
        ctx.beginPath();
        ctx.moveTo(-width * 0.5, 0);
        ctx.quadraticCurveTo(0, -height, width * 0.4, 0);
        ctx.quadraticCurveTo(0, height, -width * 0.5, 0);
        ctx.fillStyle = `rgba(0,0,0,${0.15 + f.depth * 0.2})`;
        ctx.fill();

        // 🐟 cola
        ctx.beginPath();
        ctx.moveTo(-width * 0.5, 0);
        ctx.lineTo(-width * 0.8, height * 0.6);
        ctx.lineTo(-width * 0.8, -height * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    };

    animate = () => {
        // 🌊 fondo con profundidad
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "rgba(0, 40, 80, 0.15)");
        gradient.addColorStop(1, "rgba(0, 0, 20, 0.4)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 🫧 partículas (parallax real)
        particles.forEach(p => {
            const depthFactor = 0.5 + p.depth;

            p.y -= p.speedY * depthFactor;
            p.x += p.speedX * depthFactor + Math.sin(p.y * 0.01) * 0.2;

            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            const alpha = p.alpha * depthFactor;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * depthFactor, 0, Math.PI * 2);

            ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;

            ctx.shadowBlur = 10 * p.depth;
            ctx.shadowColor = "rgba(100, 180, 255, 0.5)";

            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 🐟 peces con parallax + wiggle
        fish.forEach(f => {
            const depthFactor = 0.5 + f.depth;

            f.wiggle += 0.05;
            f.x += f.speed * f.dir * depthFactor;
            f.y += Math.sin(f.wiggle) * 0.3;

            if (f.x > canvas.width + 100) f.x = -100;
            if (f.x < -100) f.x = canvas.width + 100;

            drawFish(f);
        });

        animFrameRef.current = requestAnimationFrame(animate);
    };

    break;
}




case "forest": {
    let wind = 0;
    let time = 0;

    // 🌲 CAPAS DE BOSQUE (parallax real)
    const forestLayers = [
        {
            depth: 0.2,
            count: 8,
            color: "rgba(10,20,10,0.15)"
        },
        {
            depth: 0.5,
            count: 12,
            color: "rgba(20,40,20,0.25)"
        },
        {
            depth: 1,
            count: 16,
            color: "rgba(30,60,30,0.35)"
        }
    ];

    const trees = forestLayers.flatMap(layer =>
        Array.from({ length: layer.count }, () => ({
            x: Math.random() * canvas.width,
            depth: layer.depth,
            height: canvas.height * (0.35 + Math.random() * 0.5),
            swayOffset: Math.random() * Math.PI,
            layer
        }))
    );

    // ✨ LUCIÉRNAGAS (más vivas)
    const fireflies = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        pulse: Math.random() * Math.PI * 2
    }));

    // 🍃 HOJAS (más naturales)
    const leaves = Array.from({ length: 28 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 6 + Math.random() * 10,
        speed: 0.2 + Math.random() * 0.9,
        wobble: Math.random() * Math.PI * 2,
        depth: Math.random()
    }));

    const drawTree = (t, sway) => {
        const x = t.x + sway;
        const baseY = canvas.height;

        const trunkWidth = 5 + t.depth * 10;
        const trunkHeight = t.height;

        const baseX = x + trunkWidth / 2;

        // 🌳 tronco
        ctx.fillStyle = `rgba(15,25,15,${0.2 + t.depth * 0.5})`;
        ctx.fillRect(x, baseY - trunkHeight, trunkWidth, trunkHeight);

        // 🌲 copa en capas (pino estilizado)
        const layers = 3 + Math.floor(t.depth * 3);

        for (let i = 0; i < layers; i++) {
            const variation = 0.85 + Math.sin(t.swayOffset + i) * 0.1;
            const width = (60 + t.depth * 100) * (1 - i * 0.28) * variation;

            const height = 22 + t.depth * 12;

            const yOffset = i * (height * 0.65);

            ctx.beginPath();
            ctx.moveTo(baseX, baseY - trunkHeight - yOffset - height);
            ctx.lineTo(baseX - width / 2, baseY - trunkHeight - yOffset);
            ctx.lineTo(baseX + width / 2, baseY - trunkHeight - yOffset);
            ctx.closePath();

            const shade = 25 + t.depth * 45 - i * 6;

            ctx.fillStyle = `rgba(20, ${shade}, 20, ${0.2 + t.depth * 0.45})`;
            ctx.fill();
        }
    };

    animate = () => {
        wind += 0.006 + Math.sin(time * 0.3) * 0.002;
        time += 0.01;

        // 🌑 base más suave (menos “flash”)
        ctx.fillStyle = "rgba(5,12,5,0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 🌫️ NIEBLA EN CAPAS (depth real)
        forestLayers.forEach((layer, i) => {
            const fogY = canvas.height * (0.5 + i * 0.15);

            const fog = ctx.createLinearGradient(0, fogY, 0, canvas.height);
            fog.addColorStop(0, "rgba(200,255,200,0)");
            fog.addColorStop(1, layer.color);

            ctx.fillStyle = fog;
            ctx.fillRect(0, fogY, canvas.width, canvas.height);
        });

        // 🌫️ atmósfera suave superior
const topFog = ctx.createLinearGradient(0, 0, 0, canvas.height);
topFog.addColorStop(0, "rgba(200,255,200,0.02)");
topFog.addColorStop(0.5, "rgba(0,0,0,0)");
topFog.addColorStop(1, "rgba(0,0,0,0.25)");

ctx.fillStyle = topFog;
ctx.fillRect(0, 0, canvas.width, canvas.height);


        // 🌲 ÁRBOLES (con viento global coherente)
        trees.forEach(t => {
            const windFactor = Math.sin(wind + t.swayOffset) * (3 + t.depth * 8);
            drawTree(t, windFactor);
        });

        // ✨ LUCIÉRNAGAS (más orgánicas)
        fireflies.forEach(f => {
            f.x += f.vx + Math.sin(time + f.y * 0.01) * 0.15;
            f.y += f.vy;

            f.pulse += 0.05;
            const glow = (Math.sin(f.pulse) + 1) / 2;

            if (f.x < 0) f.x = canvas.width;
            if (f.x > canvas.width) f.x = 0;
            if (f.y < 0) f.y = canvas.height;
            if (f.y > canvas.height) f.y = 0;

            ctx.beginPath();
            ctx.arc(f.x, f.y, 1.5 + glow * 2.2, 0, Math.PI * 2);

            ctx.fillStyle = `rgba(180,255,120,${0.25 + glow * 0.6})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(180,255,120,0.6)";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 🍃 HOJAS (más físicas)
        leaves.forEach(l => {
            l.y += l.speed * (0.4 + l.depth);
            l.wobble += 0.015;

            l.x += Math.sin(l.wobble + wind) * (0.8 + l.depth * 2);

            if (l.y > canvas.height) {
                l.y = -20;
                l.x = Math.random() * canvas.width;
            }

            ctx.globalAlpha = 0.25 + l.depth * 0.5;

            ctx.beginPath();
            ctx.arc(l.x, l.y, l.size * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(140,200,140,0.8)";
            ctx.fill();
        });

        ctx.globalAlpha = 1;

        animFrameRef.current = requestAnimationFrame(animate);
    };

    break;
}





case "galaxy": {
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    const createGalaxy = () => {
        centerX = canvas.width / 2;
        centerY = canvas.height / 2;

        const densityFactor = Math.min(canvas.width, canvas.height) / 800;

        return {
            stars: Array.from({ length: 120 * densityFactor }, () => ({
                angle: Math.random() * Math.PI * 2,
                radius: 60 + Math.random() * (canvas.width * 0.6),
                speed: 0.0004 + Math.random() * 0.0015,
                size: 0.5 + Math.random() * 2,
                hue: 200 + Math.random() * 160
            })),
            particles: Array.from({ length: 70 * densityFactor }, () => ({
                angle: Math.random() * Math.PI * 2,
                radius: 80 + Math.random() * (canvas.width * 0.5),
                speed: 0.002 + Math.random() * 0.004,
                size: 1 + Math.random() * 2.5,
                life: Math.random()
            })),
            shootingStars: []
        };
    };

    let galaxy = createGalaxy();

    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        galaxy = createGalaxy();
    };

    window.addEventListener("resize", handleResize);

    let rotation = 0;
    let time = 0;

    animate = () => {
        rotation += 0.002;
        time += 0.01;

        // 🌑 fondo más oscuro
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 🌌 nebulosa sutil
        for (let i = 0; i < 2; i++) {
            const x = centerX + Math.sin(time * 0.2 + i) * 150;
            const y = centerY + Math.cos(time * 0.15 + i) * 120;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 280);
            gradient.addColorStop(0, `hsla(${260 + i * 40},100%,60%,0.05)`);
            gradient.addColorStop(1, "transparent");

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // ⭐ estrellas
        galaxy.stars.forEach(s => {
            s.angle += s.speed;

            let x = centerX + Math.cos(s.angle + rotation) * s.radius;
            let y = centerY + Math.sin(s.angle + rotation) * s.radius;

            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 220) {
                const force = (220 - dist) / 220;
                x -= dx * force * 0.8;
                y -= dy * force * 0.8;
            }

            ctx.beginPath();
            ctx.arc(x, y, s.size, 0, Math.PI * 2);

            ctx.fillStyle = `hsla(${s.hue},100%,85%,1)`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${s.hue},100%,70%,1)`;

            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 💫 partículas
        galaxy.particles.forEach(p => {
            p.angle += p.speed;
            p.radius -= 0.5;

            let x = centerX + Math.cos(p.angle) * p.radius;
            let y = centerY + Math.sin(p.angle) * p.radius;

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);

            ctx.fillStyle = `rgba(255,255,255,${p.life})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#ffffff";

            ctx.fill();
            ctx.shadowBlur = 0;

            if (p.radius < 25) {
                p.radius = 80 + Math.random() * (canvas.width * 0.5);
                p.angle = Math.random() * Math.PI * 2;
                p.life = Math.random();
            }
        });

        // 🌠 shooting stars
        if (Math.random() < 0.008) {
            galaxy.shootingStars.push({
                x: Math.random() * canvas.width,
                y: 0,
                vx: -3 - Math.random() * 2,
                vy: 3 + Math.random() * 3,
                life: 1
            });
        }

        galaxy.shootingStars.forEach((s, i) => {
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.02;

            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 5, s.y - s.vy * 5);

            ctx.strokeStyle = `rgba(255,255,255,${s.life})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            if (s.life <= 0) galaxy.shootingStars.splice(i, 1);
        });

        // 🕳️ agujero negro
        const pulse = 90 + Math.sin(time * 2) * 6;

        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, pulse);
        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(0.6, "rgba(0,0,0,0.95)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.beginPath();
        ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

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
    let frame = 0;
    let roadOffset = 0;

    const horizon = canvas.height * 0.55;

    // ⭐ estrellas
    const stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * horizon,
        depth: Math.random(),
        alpha: Math.random()
    }));

    // 🌆 skyline
    const buildings = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        w: 20 + Math.random() * 40,
        h: 40 + Math.random() * 120,
        depth: Math.random()
    }));

    // 🌄 montañas
    const mountains = [
        { height: 140, speed: 0.2, color: "#ff0080" },
        { height: 100, speed: 0.35, color: "#ff4da6" },
        { height: 70, speed: 0.5, color: "#ff80bf" }
    ];

    animate = () => {
        frame++;
        roadOffset += 2;

        // 🌌 fondo
        ctx.fillStyle = "#0a0014";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ⭐ estrellas (parallax)
        stars.forEach(s => {
            s.alpha += (Math.random() - 0.5) * 0.05;
            s.alpha = Math.max(0.3, Math.min(1, s.alpha));

            const speed = 0.1 + s.depth * 0.3;
            s.x -= speed;

            if (s.x < 0) {
                s.x = canvas.width;
                s.y = Math.random() * horizon;
            }

            ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
            ctx.fillRect(s.x, s.y, 2, 2);
        });

        // ☀️ sol
        const cx = canvas.width / 2;
        const cy = horizon - 60;

        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = `rgba(255,100,150,${1 - i * 0.15})`;
            ctx.fillRect(cx - 100 + i * 8, cy - 60 + i * 12, 200 - i * 16, 18);
        }

        // 🌄 montañas
        mountains.forEach(layer => {
            ctx.fillStyle = layer.color;

            for (let x = -100; x < canvas.width + 100; x += 50) {
                const y =
                    horizon +
                    Math.sin((x + frame * layer.speed) * 0.01) * layer.height;

                ctx.beginPath();
                ctx.moveTo(x, horizon);
                ctx.lineTo(x + 25, y);
                ctx.lineTo(x + 50, horizon);
                ctx.closePath();
                ctx.fill();
            }
        });

        // 🌆 skyline
        buildings.forEach(b => {
            const speed = 0.2 + b.depth * 0.5;
            b.x -= speed;

            if (b.x + b.w < 0) {
                b.x = canvas.width;
                b.h = 40 + Math.random() * 120;
            }

            ctx.fillStyle = `rgba(20,0,40,${0.8 + b.depth * 0.2})`;
            ctx.fillRect(b.x, horizon - b.h, b.w, b.h);

            // ventanas pixel
            for (let wy = 0; wy < b.h; wy += 8) {
                for (let wx = 0; wx < b.w; wx += 6) {
                    if (Math.random() < 0.1) {
                        ctx.fillStyle = "rgba(255,200,255,0.6)";
                        ctx.fillRect(b.x + wx, horizon - b.h + wy, 2, 2);
                    }
                }
            }
        });

        // 🛣️ RUTA (perspectiva)
        ctx.fillStyle = "#050505";
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.2, canvas.height);
        ctx.lineTo(canvas.width * 0.8, canvas.height);
        ctx.lineTo(canvas.width * 0.55, horizon);
        ctx.lineTo(canvas.width * 0.45, horizon);
        ctx.closePath();
        ctx.fill();

        // líneas de carril animadas
        for (let i = 0; i < 30; i++) {
            const t = (i * 40 + roadOffset) % canvas.height;
            const scale = t / canvas.height;

            const x = canvas.width / 2;
            const y = horizon + t;

            const width = 4 + scale * 10;
            const height = 10 + scale * 20;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x - width / 2, y, width, height);
        }

        // 🚗 AUTO (simple pixel car)
        const carX = canvas.width / 2;
        const carY = canvas.height - 60;

        ctx.fillStyle = "#ff0080";
        ctx.fillRect(carX - 20, carY, 40, 10); // base

        ctx.fillStyle = "#ff4da6";
        ctx.fillRect(carX - 15, carY - 10, 30, 10); // cabina

        // ruedas
        ctx.fillStyle = "#000";
        ctx.fillRect(carX - 18, carY + 8, 8, 6);
        ctx.fillRect(carX + 10, carY + 8, 8, 6);

        // luces
        ctx.fillStyle = "rgba(255,255,200,0.8)";
        ctx.fillRect(carX - 12, carY - 2, 4, 2);
        ctx.fillRect(carX + 8, carY - 2, 4, 2);

        // 📺 scanlines
        for (let y = 0; y < canvas.height; y += 4) {
            ctx.fillStyle = "rgba(0,0,0,0.06)";
            ctx.fillRect(0, y, canvas.width, 2);
        }

        // ⚡ glow sutil
        ctx.fillStyle = "rgba(255,0,120,0.03)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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
            window.removeEventListener("user-typing", increaseFire);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, [theme]);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none"
                style={{ opacity: 0.7, zIndex: -2 }}
            />

            {theme === "galaxy" && (
                <div className="gravitational-lens"></div>
            )}
        </>
    );
}