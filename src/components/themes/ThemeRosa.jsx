// ============================================
// 🌸 TEMA ROSA - Pétalos flotando
// Archivo: src/components/themes/ThemeRosa.jsx
// ============================================

export function createRosaAnimation(ctx, canvas) {
    const PETALS = ["🌸", "🌺", "🌹", "💮"];
    let animId = null;
    let stopped = false;
    
    const particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 14 + Math.random() * 12,
        speed: 0.5 + Math.random() * 1.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        rotationOffset: Math.random() * Math.PI,
        emoji: PETALS[Math.floor(Math.random() * PETALS.length)]
    }));

    const animate = () => {
        if (stopped) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y += p.speed;
            p.wobble += p.wobbleSpeed;
            p.x += Math.sin(p.wobble) * (0.5 + p.size * 0.02);

            if (p.y > canvas.height) {
                p.y = -20 - Math.random() * 100;
                p.x = Math.random() * canvas.width;
            }

            ctx.font = `${p.size}px serif`;
            ctx.globalAlpha = 0.6 + Math.sin(p.y * 0.05) * 0.2;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.sin(p.wobble + p.rotationOffset) * 0.3);
            ctx.fillText(p.emoji, 0, 0);
            ctx.restore();
        });

        ctx.globalAlpha = 1;
        animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        stopped = true;
        if (animId) cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
}