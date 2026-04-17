// ============================================
// 🌸 TEMA ROSA - Cascada de pétalos rosa
// ============================================

export function createRosaAnimation(ctx, canvas) {
    const PETALS = ["🌸", "🌺", "🌹", "💮", "🌻", "🌷", "🎀", "✨"];
    let animId = null;
    let stopped = false;
    
    const particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 16 + Math.random() * 18,
        speed: 1.2 + Math.random() * 2.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.012 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        emoji: PETALS[Math.floor(Math.random() * PETALS.length)]
    }));

    const animate = () => {
        if (stopped) return;
        ctx.fillStyle = "rgba(255, 235, 245, 0.06)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y += p.speed;
            p.wobble += p.wobbleSpeed;
            p.rotation += p.rotationSpeed;
            p.x += Math.sin(p.wobble) * 0.9;

            if (p.y > canvas.height + 25) {
                p.y = -28;
                p.x = Math.random() * canvas.width;
                p.speed = 1.2 + Math.random() * 2.5;
            }

            ctx.font = `${p.size}px serif`;
            ctx.globalAlpha = 0.85;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillText(p.emoji, 0, 0);
            ctx.restore();
        });

        ctx.globalAlpha = 1;
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