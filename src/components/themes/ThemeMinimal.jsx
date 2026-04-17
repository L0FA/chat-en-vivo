// ============================================
// ⚪ TEMA MINIMAL - Círculos y líneas sutiles (Optimizado)
// ============================================

export function createMinimalAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const circles = Array.from({ length: 15 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 30 + Math.random() * 120,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        hue: Math.random() * 360,
        lineWidth: 1 + Math.random() * 2,
        alpha: 0.15 + Math.random() * 0.15
    }));

    const dots = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        hue: Math.random() * 360
    }));

    const animate = () => {
        if (stopped) return;

        // Fondo crema suave (más oscuro para mejor contraste)
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, "#f5f0e6");
        bgGradient.addColorStop(1, "#ebe5d8");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Actualizar círculos
        circles.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;
            if (c.x < -c.size) c.x = canvas.width + c.size;
            if (c.x > canvas.width + c.size) c.x = -c.size;
            if (c.y < -c.size) c.y = canvas.height + c.size;
            if (c.y > canvas.height + c.size) c.y = -c.size;

            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${c.hue}, 30%, 50%, ${c.alpha})`;
            ctx.lineWidth = c.lineWidth;
            ctx.stroke();
        });

        // Actualizar puntos
        dots.forEach(d => {
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
            if (d.y < 0 || d.y > canvas.height) d.vy *= -1;

            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${d.hue}, 40%, 60%, 0.5)`;
            ctx.fill();
        });

        // Líneas sutiles entre puntos cercanos
        ctx.lineWidth = 0.5;
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 100) {
                    const alpha = (1 - dist / 100) * 0.15;
                    ctx.strokeStyle = `rgba(150, 150, 150, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }
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

export function createDefaultAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        hue: 330 + Math.random() * 60,
        alpha: 0.4 + Math.random() * 0.4
    }));

    const animate = () => {
        if (stopped) return;

        // Fondo suave
        ctx.fillStyle = "rgba(245, 245, 250, 0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${p.alpha})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = `hsla(${p.hue}, 70%, 65%, 0.5)`;
            ctx.fill();
            ctx.shadowBlur = 0;
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