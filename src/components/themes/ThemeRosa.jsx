// ============================================
// 🌸 TEMA ROSA - Cascada de pétalos (estilo chat-en-vivo)
// ============================================

export function createRosaAnimation(ctx, canvas) {
    const PETALS = ["🌸", "🌺", "🌹", "💮", "🌷", "🎀", "✨"];
    let animId = null;
    let stopped = false;
    
    const particles = Array.from({ length: 25 }, () => createPetal());

    function createPetal() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 20 + Math.random() * 14,
            speed: 2 + Math.random() * 3,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.015 + Math.random() * 0.02,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.06,
            emoji: PETALS[Math.floor(Math.random() * PETALS.length)]
        };
    }

    const animate = () => {
        if (stopped) return;
        
        ctx.fillStyle = "#fff5f8";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#ffe9f1");
        gradient.addColorStop(1, "#fff0f5");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y += p.speed;
            p.wobble += p.wobbleSpeed;
            p.rotation += p.rotationSpeed;
            p.x += Math.sin(p.wobble) * 0.8;

            if (p.y > canvas.height + 30) {
                p.y = -32;
                p.x = Math.random() * canvas.width;
                p.speed = 2 + Math.random() * 3;
                p.emoji = PETALS[Math.floor(Math.random() * PETALS.length)];
            }

            ctx.font = `${p.size}px serif`;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillText(p.emoji, 0, 0);
            ctx.restore();
        });

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