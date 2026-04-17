// ============================================
// ⭐ TEMA DARK - Estrellas parpadeando
// ============================================

export function createDarkAnimation(ctx, canvas) {
    let animId = null;
    const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.5 + Math.random() * 2,
        alpha: Math.random(),
        speed: 0.005 + Math.random() * 0.02,
        dir: Math.random() > 0.5 ? 1 : -1
    }));

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.alpha += p.speed * p.dir;
            if (p.alpha >= 1 || p.alpha <= 0) p.dir *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
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