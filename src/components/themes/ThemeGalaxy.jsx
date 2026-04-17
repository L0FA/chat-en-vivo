// ============================================
// 🌌 TEMA GALAXY - Galaxia con estrellas
// ============================================

export function createGalaxyAnimation(ctx, canvas) {
    let animId = null;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const stars = Array.from({ length: 60 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 50 + Math.random() * (canvas.width * 0.5),
        speed: 0.001 + Math.random() * 0.002,
        hue: 200 + Math.random() * 160
    }));

    const animate = () => {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        stars.forEach(s => {
            s.angle += s.speed;
            const x = centerX + Math.cos(s.angle) * s.radius;
            const y = centerY + Math.sin(s.angle) * s.radius;
            ctx.beginPath();
            ctx.arc(x, y, 1 + Math.random(), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue},100%,60%,0.6)`;
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