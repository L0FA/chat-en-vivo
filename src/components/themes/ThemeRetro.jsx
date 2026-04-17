// ============================================
// 🚗 TEMA RETRO - Estilo Synthwave 80s
// ============================================

export function createRetroAnimation(ctx, canvas) {
    let animId = null;
    const stars = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.6,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.5
    }));

    const animate = () => {
        ctx.fillStyle = "rgba(20,0,40,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,150,200,${s.alpha})`;
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