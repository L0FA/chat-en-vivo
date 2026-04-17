// ============================================
// 🤖 TEMA CYBERPUNK - Red neuronal con glitch (Optimizado)
// ============================================

export function createCyberpunkAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let glitchFrame = 0;

    // Nodos principales de la red
    const nodes = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 3 + Math.random() * 4,
        pulse: Math.random() * Math.PI * 2,
        color: Math.random() > 0.7 ? "#ff0080" : "#00ffff"
    }));

    // Líneas de datos
    const dataLines = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: 60 + Math.random() * 120,
        dir: Math.random() > 0.5 ? "h" : "v",
        speed: 1 + Math.random() * 2,
        alpha: 0
    }));

    // Hexágonos decorativos
    const hexagons = Array.from({ length: 8 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 30 + Math.random() * 50,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.002
    }));

    const drawHexagon = (x, y, size, rotation, color, alpha) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = Math.cos(angle) * size;
            const hy = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.restore();
    };

    const animate = () => {
        if (stopped) return;

        // Fondo oscuro con gradiente
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, "rgba(5, 0, 15, 0.1)");
        bgGradient.addColorStop(0.5, "rgba(10, 0, 20, 0.1)");
        bgGradient.addColorStop(1, "rgba(5, 0, 10, 0.1)");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar hexágonos de fondo
        hexagons.forEach(h => {
            h.rotation += h.rotationSpeed;
            drawHexagon(h.x, h.y, h.size, h.rotation, "#ff0080", 0.08);
        });

        // Actualizar y dibujar nodos
        nodes.forEach(n => {
            n.x += n.vx;
            n.y += n.vy;
            n.pulse += 0.04;

            if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
            if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

            const sizeMod = (Math.sin(n.pulse) + 1) * 1.5;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.size + sizeMod, 0, Math.PI * 2);
            ctx.fillStyle = n.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = n.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Dibujar conexiones entre nodos cercanos
        ctx.lineWidth = 0.8;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 180) {
                    const alpha = (1 - dist / 180) * 0.3;
                    const gradient = ctx.createLinearGradient(
                        nodes[i].x, nodes[i].y,
                        nodes[j].x, nodes[j].y
                    );
                    gradient.addColorStop(0, `rgba(255, 0, 128, ${alpha})`);
                    gradient.addColorStop(1, `rgba(0, 255, 255, ${alpha})`);
                    ctx.strokeStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        // Líneas de datos en movimiento
        dataLines.forEach(d => {
            d.alpha += d.dir === "h" ? 0.02 : -0.015;
            if (d.alpha >= 1) d.alpha = 1;
            if (d.alpha <= 0) {
                d.alpha = 0;
                d.x = Math.random() * canvas.width;
                d.y = Math.random() * canvas.height;
            }

            const currentAlpha = Math.abs(Math.sin(d.alpha));
            ctx.strokeStyle = `rgba(0, 255, 255, ${currentAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#00ffff";
            ctx.beginPath();
            if (d.dir === "h") {
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + d.length, d.y);
            } else {
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x, d.y + d.length);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // Efectos de glitch
        glitchFrame++;
        if (glitchFrame % 80 === 0) {
            const y = Math.random() * canvas.height;
            const h = 15 + Math.random() * 25;
            ctx.globalAlpha = 0.15;
            ctx.drawImage(canvas, 0, y, canvas.width, h, (Math.random() - 0.5) * 30, y, canvas.width, h);
            ctx.globalAlpha = 1;
        }

        // Flash aleatorio
        if (Math.random() < 0.002) {
            ctx.fillStyle = "rgba(255, 0, 140, 0.15)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Scanlines
        ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
        for (let y = 0; y < canvas.height; y += 3) {
            ctx.fillRect(0, y, canvas.width, 1);
        }

        if (!stopped) animId = requestAnimationFrame(animate);
    };

    animate();

    return {
        stop: () => {
            stopped = true;
            if (animId) cancelAnimationFrame(animId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
}