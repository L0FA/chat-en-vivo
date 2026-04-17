// ============================================
// 🌊 TEMA OCEAN - Burbujas, peces yluces
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const particles = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 4,
        depth: Math.random(),
        speedY: 0.15 + Math.random() * 0.6,
        speedX: (Math.random() - 0.5) * 0.3,
        alpha: 0.2 + Math.random() * 0.4
    }));

    const fish = Array.from({ length: 8 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        speed: 0.25 + Math.random() * 0.8,
        size: 25 + Math.random() * 60,
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
        ctx.fillStyle = `rgba(0,0,0,${0.12 + f.depth * 0.2})`;
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
        if (stopped) return;
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "rgba(0, 30, 70, 0.12)");
        gradient.addColorStop(1, "rgba(0, 0, 15, 0.35)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            const depthFactor = 0.5 + p.depth;
            p.y -= p.speedY * depthFactor;
            p.x += p.speedX * depthFactor + Math.sin(p.y * 0.008) * 0.2;

            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            const alpha = p.alpha * depthFactor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * depthFactor, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(160, 210, 255, ${alpha})`;
            ctx.shadowBlur = 8 * p.depth;
            ctx.shadowColor = "rgba(80, 160, 255, 0.5)";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        fish.forEach(f => {
            const depthFactor = 0.5 + f.depth;
            f.wiggle += 0.04;
            f.x += f.speed * f.dir * depthFactor;
            f.y += Math.sin(f.wiggle) * 0.25;

            if (f.x > canvas.width + 90) f.x = -90;
            if (f.x < -90) f.x = canvas.width + 90;

            drawFish(f);
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