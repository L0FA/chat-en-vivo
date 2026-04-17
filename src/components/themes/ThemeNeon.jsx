// ============================================
// 💡 TEMA NEON - Partículas de neón flotando
// ============================================

export function createNeonAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const particles = Array.from({ length: 55 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1.8 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        hue: Math.random() * 110 + 120
    }));

    const animate = () => {
        if (stopped) return;
        ctx.fillStyle = "rgba(12,12,30,0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue},100%,58%,0.78)`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = `hsla(${p.hue},100%,60%,1)`;
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