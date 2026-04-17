// ============================================
// 🌊 TEMA OCEAN - Burbujas y peces
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    const particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 3,
        vy: -(0.2 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.2
    }));

    const animate = () => {
        ctx.fillStyle = "rgba(0,30,60,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(150,200,255,0.6)";
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