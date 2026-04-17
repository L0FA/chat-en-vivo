// ============================================
// 🌲 TEMA FOREST - Bosques con luciérnagas
// ============================================

export function createForestAnimation(ctx, canvas) {
    let animId = null;
    const particles = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        pulse: Math.random() * Math.PI * 2
    }));

    const animate = () => {
        ctx.fillStyle = "rgba(0,20,0,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.03;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const glow = (Math.sin(p.pulse) + 1) / 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1 + glow * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(150,255,100,${0.3 + glow * 0.5})`;
            ctx.fill();
        });

        animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animId) cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
}