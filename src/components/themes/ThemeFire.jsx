// ============================================
// 🔥 TEMA FIRE - Fuego, humo y chispas
// ============================================

export function createFireAnimation(ctx, canvas) {
    let animId = null;
    const particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(1 + Math.random() * 2),
        life: 0.5 + Math.random() * 0.5,
        decay: 0.005 + Math.random() * 0.01
    }));

    const animate = () => {
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.life -= p.decay;
            p.x += p.vx;
            p.y += p.vy;

            if (p.life <= 0 || p.y < 0) {
                p.x = Math.random() * canvas.width;
                p.y = canvas.height;
                p.life = 1;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,${100 + Math.floor(p.life * 100)},0,${p.life})`;
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