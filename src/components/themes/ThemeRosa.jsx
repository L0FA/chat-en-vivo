// ============================================
// 🌸 TEMA ROSA - Pétalos flotando
// Archivo: src/components/themes/ThemeRosa.jsx
// ============================================

export function createRosaAnimation(ctx, canvas) {
    const PETALS = ["🌸", "🌺", "🌹", "💮"];
    let animId = null;
    
    const particles = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 14 + Math.random() * 10,
        speed: 1.5 + Math.random() * 2,
        wobble: Math.random() * Math.PI * 2,
        emoji: PETALS[Math.floor(Math.random() * PETALS.length)]
    }));

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y += p.speed;
            p.wobble += 0.02;
            p.x += Math.sin(p.wobble) * 0.8;

            if (p.y > canvas.height) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }

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