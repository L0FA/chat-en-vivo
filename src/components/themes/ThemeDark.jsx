// ============================================
// 🌙 TEMA DARK - Estrellas parpadeando con nebulosas (Optimizado)
// ============================================

export function createDarkAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    // Estrellas de diferentes tamaños y brillos
    const stars = Array.from({ length: 150 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.5 + Math.random() * 2.5,
        alpha: Math.random(),
        speed: 0.005 + Math.random() * 0.015,
        dir: Math.random() > 0.5 ? 1 : -1,
        color: Math.random() > 0.9 ? "rgba(200, 220, 255," : "rgba(255, 255, 255,"
    }));

    // Nebulosas de fondo
    const nebulae = Array.from({ length: 5 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 100 + Math.random() * 200,
        hue: 220 + Math.random() * 60,
        drift: (Math.random() - 0.5) * 0.3
    }));

    const animate = () => {
        if (stopped) return;

        // Fondo oscuro profundo con gradiente
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#0a0a0f");
        gradient.addColorStop(0.5, "#0f0f1a");
        gradient.addColorStop(1, "#1a1a2e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar nebulosas
        nebulae.forEach(n => {
            n.x += n.drift;
            if (n.x < -n.radius) n.x = canvas.width + n.radius;
            if (n.x > canvas.width + n.radius) n.x = -n.radius;

            const nebulaGradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
            nebulaGradient.addColorStop(0, `hsla(${n.hue}, 60%, 50%, 0.08)`);
            nebulaGradient.addColorStop(0.5, `hsla(${n.hue}, 70%, 60%, 0.04)`);
            nebulaGradient.addColorStop(1, "transparent");

            ctx.fillStyle = nebulaGradient;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Dibujar estrellas
        stars.forEach(p => {
            p.alpha += p.speed * p.dir;
            if (p.alpha >= 1 || p.alpha <= 0) p.dir *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            // Brillo especial para estrellas más grandes
            if (p.size > 1.5) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = `${p.color}${p.alpha * 0.9})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Estrellas fugaces ocasionales
        if (Math.random() < 0.008) {
            const startX = Math.random() * canvas.width;
            const startY = Math.random() * canvas.height * 0.5;
            const length = 50 + Math.random() * 100;
            const angle = Math.PI / 4;

            const trailGradient = ctx.createLinearGradient(
                startX, startY,
                startX + Math.cos(angle) * length,
                startY + Math.sin(angle) * length
            );
            trailGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
            trailGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.6)");
            trailGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

            ctx.strokeStyle = trailGradient;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(
                startX + Math.cos(angle) * length,
                startY + Math.sin(angle) * length
            );
            ctx.stroke();
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