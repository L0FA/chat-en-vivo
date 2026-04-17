// ============================================
// 🌸 TEMA ROSA - Pétalos flotando con fondorosa
// ============================================

export function createRosaAnimation(ctx, canvas) {
    const PETALS = ["🌸", "🌺", "🌹", "💮", "🌻", "🌷"];
    let animId = null;
    let stopped = false;
    
    const particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 14 + Math.random() * 14,
        speed: 0.8 + Math.random() * 2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.015 + Math.random() * 0.025,
        rotationOffset: Math.random() * Math.PI,
        emoji: PETALS[Math.floor(Math.random() * PETALS.length)],
        alpha: 0.5 + Math.random() * 0.5
    }));

    const animate = () => {
        if (stopped) return;
        ctx.fillStyle = "rgba(255, 240, 245, 0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y += p.speed;
            p.wobble += p.wobbleSpeed;
            p.x += Math.sin(p.wobble) * (0.5 + p.size * 0.015);

            if (p.y > canvas.height + 20) {
                p.y = -25;
                p.x = Math.random() * canvas.width;
            }

            ctx.font = `${p.size}px serif`;
            ctx.globalAlpha = p.alpha;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.sin(p.wobble + p.rotationOffset) * 0.4);
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