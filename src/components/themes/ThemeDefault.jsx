// ============================================
// ⚪ TEMA DEFAULT/CLÁSICO - Burbujas Elegantes
// ============================================

export function createDefaultAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    // Círculos flotantes de distintos tamaños
    const circles = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 8 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        hue: 240 + Math.random() * 80, // Azules a púrpuras
        alpha: 0.08 + Math.random() * 0.12,
        pulse: Math.random() * Math.PI * 2
    }));

    // Partículas pequeñas brillantes
    const sparkles = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        hue: 260 + Math.random() * 100,
        phase: Math.random() * Math.PI * 2
    }));

    const animate = () => {
        if (stopped) return;
        time += 0.008;

        // Fondo con gradiente sutil
        const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bg.addColorStop(0, "#0d0d1a");
        bg.addColorStop(0.5, "#151528");
        bg.addColorStop(1, "#1a1a30");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Círculos grandes con borde brillante
        circles.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;
            if (c.x < -c.size) c.x = canvas.width + c.size;
            if (c.x > canvas.width + c.size) c.x = -c.size;
            if (c.y < -c.size) c.y = canvas.height + c.size;
            if (c.y > canvas.height + c.size) c.y = -c.size;

            const pulseSize = c.size + Math.sin(time + c.pulse) * 3;

            // Relleno suave
            const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, pulseSize);
            grad.addColorStop(0, `hsla(${c.hue}, 60%, 50%, ${c.alpha * 1.5})`);
            grad.addColorStop(0.7, `hsla(${c.hue}, 50%, 40%, ${c.alpha * 0.5})`);
            grad.addColorStop(1, `hsla(${c.hue}, 40%, 30%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(c.x, c.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();

            // Borde luminoso
            ctx.strokeStyle = `hsla(${c.hue}, 70%, 65%, ${c.alpha * 2})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(c.x, c.y, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Líneas de conexión entre círculos cercanos
        ctx.strokeStyle = "rgba(100, 120, 200, 0.04)";
        ctx.lineWidth = 1;
        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                const dx = circles[i].x - circles[j].x;
                const dy = circles[i].y - circles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.globalAlpha = (1 - dist / 150) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(circles[i].x, circles[i].y);
                    ctx.lineTo(circles[j].x, circles[j].y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;

        // Partículas brillantes
        sparkles.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            if (s.x < 0 || s.x > canvas.width) s.vx *= -1;
            if (s.y < 0 || s.y > canvas.height) s.vy *= -1;

            const glow = 0.3 + Math.sin(time * 3 + s.phase) * 0.7;
            if (glow > 0.2) {
                ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${glow * 0.6})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

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