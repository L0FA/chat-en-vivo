// ============================================
// 🌸 TEMA DARKPINK - Pétalos cayendo
// ============================================

export function createDarkPinkAnimation(ctx, canvas) {
    const PETALS = ["🌸", "🌺", "🌹", "💮"];
    let animId = null;

    const particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 14 + Math.random() * 12,
        speed: 0.5 + Math.random() * 1.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        emoji: PETALS[Math.floor(Math.random() * PETALS.length)]
    }));

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.y += p.speed;
            p.wobble += p.wobbleSpeed;
            p.x += Math.sin(p.wobble) * 0.8;
            if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
            ctx.font = `${p.size}px serif`;
            ctx.globalAlpha = 0.7;
            ctx.fillText(p.emoji, p.x, p.y);
        });
        ctx.globalAlpha = 1;
        animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animId) cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
}