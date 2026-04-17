// ============================================
// 🌊 TEMA OCEAN - Burbujas, peces yluces (SIN opacidad)
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 4,
        depth: Math.random(),
        speedY: 0.15 + Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.25
    }));

    const fish = Array.from({ length: 6 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        speed: 0.25 + Math.random() * 0.6,
        size: 25 + Math.random() * 50,
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

        ctx.fillStyle = "#061020";
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
        
        ctx.fillStyle = "#000a15";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#001530");
        gradient.addColorStop(1, "#000005");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y -= p.speedY;
            p.x += p.speedX + Math.sin(p.y * 0.008) * 0.15;

            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            ctx.fillStyle = "#4080aa";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        fish.forEach(f => {
            f.wiggle += 0.035;
            f.x += f.speed * f.dir;
            f.y += Math.sin(f.wiggle) * 0.2;

            if (f.x > canvas.width + 80) f.x = -80;
            if (f.x < -80) f.x = canvas.width + 80;

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