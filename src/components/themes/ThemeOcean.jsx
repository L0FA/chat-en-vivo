// ============================================
// 🌊 TEMA OCEAN - Estilo chat-en-vivo (fondo claro)
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 3,
        speedY: 0.1 + Math.random() * 0.4,
        speedX: (Math.random() - 0.5) * 0.15
    }));

    const fish = Array.from({ length: 4 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.65,
        speed: 0.2 + Math.random() * 0.4,
        size: 18 + Math.random() * 30,
        dir: Math.random() > 0.5 ? 1 : -1,
        wiggle: Math.random() * Math.PI * 2
    }));

    const drawFish = (f) => {
        const width = f.size;
        const height = width * 0.4;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.dir, 1);

        ctx.fillStyle = "#0a3050";
        ctx.beginPath();
        ctx.moveTo(-width * 0.5, 0);
        ctx.quadraticCurveTo(0, -height, width * 0.4, 0);
        ctx.quadraticCurveTo(0, height, -width * 0.5, 0);
        ctx.fill();

        ctx.fillStyle = "#051830";
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
        
        // Fondo estilo chat-en-vivo - gradiente claro SIN opacidad
        ctx.fillStyle = "#effbff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#d9f3ff");
        gradient.addColorStop(1, "#eaf8ff");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y -= p.speedY;
            p.x += p.speedX + Math.sin(p.y * 0.006) * 0.1;

            if (p.y < -6) {
                p.y = canvas.height + 6;
                p.x = Math.random() * canvas.width;
            }

            ctx.fillStyle = "#0ea5e9";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        fish.forEach(f => {
            f.wiggle += 0.025;
            f.x += f.speed * f.dir;
            f.y += Math.sin(f.wiggle) * 0.12;

            if (f.x > canvas.width + 50) f.x = -50;
            if (f.x < -50) f.x = canvas.width + 50;

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