// ============================================
// 🌊 TEMA OCEAN - Burbujas y peces
// ============================================

export function createOceanAnimation(ctx, canvas) {
    const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 4,
        depth: Math.random(),
        speedY: 0.2 + Math.random() * 0.6,
        speedX: (Math.random() - 0.5) * 0.3,
        alpha: 0.2 + Math.random() * 0.4
    }));

    const fish = Array.from({ length: 6 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        speed: 0.3 + Math.random() * 0.8,
        size: 30 + Math.random() * 70,
        dir: Math.random() > 0.5 ? 1 : -1,
        depth: Math.random(),
        wiggle: Math.random() * Math.PI * 2
    }));

    const drawFish = (f) => {
        const scale = 0.5 + f.depth;
        const width = f.size * scale;
        const height = width * 0.4;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.dir, 1);

        ctx.beginPath();
        ctx.moveTo(-width * 0.5, 0);
        ctx.quadraticCurveTo(0, -height, width * 0.4, 0);
        ctx.quadraticCurveTo(0, height, -width * 0.5, 0);
        ctx.fillStyle = `rgba(0,0,0,${0.15 + f.depth * 0.2})`;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-width * 0.5, 0);
        ctx.lineTo(-width * 0.8, height * 0.6);
        ctx.lineTo(-width * 0.8, -height * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    };

    const animate = () => {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "rgba(0, 40, 80, 0.15)");
        gradient.addColorStop(1, "rgba(0, 0, 20, 0.4)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            const depthFactor = 0.5 + p.depth;
            p.y -= p.speedY * depthFactor;
            p.x += p.speedX * depthFactor + Math.sin(p.y * 0.01) * 0.2;

            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            const alpha = p.alpha * depthFactor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * depthFactor, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
            ctx.shadowBlur = 10 * p.depth;
            ctx.shadowColor = "rgba(100, 180, 255, 0.5)";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        fish.forEach(f => {
            const depthFactor = 0.5 + f.depth;
            f.wiggle += 0.05;
            f.x += f.speed * f.dir * depthFactor;
            f.y += Math.sin(f.wiggle) * 0.3;

            if (f.x > canvas.width + 100) f.x = -100;
            if (f.x < -100) f.x = canvas.width + 100;

            drawFish(f);
        });

        return requestAnimationFrame(animate);
    };

    return animate;
}