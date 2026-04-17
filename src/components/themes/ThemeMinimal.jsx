// ============================================
// ⭕ TEMA MINIMAL - Círculos minimalistas con colores
// ============================================

export function createMinimalAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const circles = Array.from({ length: 12 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 25 + Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        hue: Math.random() * 360,
        lineWidth: 1 + Math.random() * 3
    }));

    const animate = () => {
        if (stopped) return;
        ctx.fillStyle = "rgba(250, 250, 250, 0.04)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        circles.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;
            if (c.x < -c.size) c.x = canvas.width + c.size;
            if (c.x > canvas.width + c.size) c.x = -c.size;
            if (c.y < -c.size) c.y = canvas.height + c.size;
            if (c.y > canvas.height + c.size) c.y = -c.size;

            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${c.hue}, 30%, 50%, 0.15)`;
            ctx.lineWidth = c.lineWidth;
            ctx.stroke();
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

export function createDefaultAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const particles = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1.5 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        hue: 330 + Math.random() * 60
    }));

    const animate = () => {
        if (stopped) return;
        ctx.fillStyle = "rgba(255, 245, 250, 0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, 0.5)`;
            ctx.fill();
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