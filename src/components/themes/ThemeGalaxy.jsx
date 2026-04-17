// ============================================
// 🌌 TEMA GALAXY - Estilo chat-en-vivo (oscuro sin opacidad)
// ============================================

export function createGalaxyAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const stars = Array.from({ length: 120 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 40 + Math.random() * (canvas.width * 0.5),
        speed: 0.0003 + Math.random() * 0.0012,
        size: 0.4 + Math.random() * 1.5,
        hue: 200 + Math.random() * 140
    }));

    const particles = Array.from({ length: 60 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 60 + Math.random() * (canvas.width * 0.4),
        speed: 0.0015 + Math.random() * 0.003,
        size: 0.8 + Math.random() * 1.8,
        life: Math.random()
    }));

    let rotation = 0;
    let time = 0;
    const shootingStars = [];

    const animate = () => {
        if (stopped) return;
        rotation += 0.0015;
        time += 0.006;

        // Fondo estilo chat-en-vivo - gradiente oscuro SIN opacidad
        ctx.fillStyle = "#0f0c24";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, "#1a0d30");
        bgGrad.addColorStop(1, "#2d1548");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Brillos sutiles
        for (let i = 0; i < 2; i++) {
            const x = centerX + Math.sin(time * 0.15 + i) * 100;
            const y = centerY + Math.cos(time * 0.1 + i) * 80;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 200);
            gradient.addColorStop(0, "#4a2080");
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const blackHoleRadius = 20;

        stars.forEach(s => {
            s.angle += s.speed;
            let x = centerX + Math.cos(s.angle + rotation) * s.radius;
            let y = centerY + Math.sin(s.angle + rotation) * s.radius;

            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 180) {
                const force = Math.pow((180 - dist) / 180, 1.5);
                const suctionSpeed = 0.3;
                x -= dx * force * suctionSpeed;
                y -= dy * force * suctionSpeed;

                if (dist < blackHoleRadius * 2) {
                    s.radius = 50 + Math.random() * (canvas.width * 0.45);
                    s.angle = Math.random() * Math.PI * 2;
                }
            }

            ctx.beginPath();
            ctx.arc(x, y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${s.hue}, 100%, 80%)`;
            ctx.fill();
        });

        particles.forEach(p => {
            p.angle += p.speed;
            p.radius -= 0.4;
            let x = centerX + Math.cos(p.angle) * p.radius;
            let y = centerY + Math.sin(p.angle) * p.radius;

            if (p.radius < 18) {
                p.radius = 55 + Math.random() * (canvas.width * 0.4);
                p.angle = Math.random() * Math.PI * 2;
                p.life = Math.random();
            }

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(255, 255, 255)`;
            ctx.fill();
        });

        if (Math.random() < 0.005) {
            shootingStars.push({
                x: Math.random() * canvas.width,
                y: 0,
                vx: -2 - Math.random() * 1.5,
                vy: 2 + Math.random() * 2,
                life: 1
            });
        }

        shootingStars.forEach((ss, index) => {
            ss.x += ss.vx;
            ss.y += ss.vy;
            ss.life -= 0.02;

            if (ss.life <= 0) {
                shootingStars.splice(index, 1);
                return;
            }

            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(ss.x - ss.vx * 3, ss.y - ss.vy * 3);
            ctx.strokeStyle = `rgb(255, 255, 255)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
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