// ============================================
// 🌊 TEMA OCEAN - Océano profundo SIN opacidad
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 3,
        speedY: 0.1 + Math.random() * 0.4,
        speedX: (Math.random() - 0.5) * 0.2
    }));

    const fish = Array.from({ length: 5 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        speed: 0.2 + Math.random() * 0.5,
        size: 20 + Math.random() * 40,
        dir: Math.random() > 0.5 ? 1 : -1,
        wiggle: Math.random() * Math.PI * 2
    }));

    const drawFish = (f) => {
        const width = f.size;
        const height = width * 0.4;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.dir, 1);

        ctx.fillStyle = "#0a1520";
        ctx.beginPath();
        ctx.moveTo(-width * 0.5, 0);
        ctx.quadraticCurveTo(0, -height, width * 0.4, 0);
        ctx.quadraticCurveTo(0, height, -width * 0.5, 0);
        ctx.fill();

        ctx.fillStyle = "#050a10";
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
        
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#000a18";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y -= p.speedY;
            p.x += p.speedX + Math.sin(p.y * 0.006) * 0.1;

            if (p.y < -8) {
                p.y = canvas.height + 8;
                p.x = Math.random() * canvas.width;
            }

            ctx.fillStyle = "#205080";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        fish.forEach(f => {
            f.wiggle += 0.03;
            f.x += f.speed * f.dir;
            f.y += Math.sin(f.wiggle) * 0.15;

            if (f.x > canvas.width + 60) f.x = -60;
            if (f.x < -60) f.x = canvas.width + 60;

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