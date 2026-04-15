// ============================================
// 💡 TEMA NEON - Partículas de neón flotando
// ============================================

export function createNeonAnimation(ctx, canvas) {
    const particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        hue: Math.random() * 120 + 120
    }));

    const animate = () => {
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
        return requestAnimationFrame(animate);
    };

    return animate;
}