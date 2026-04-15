// ============================================
// 🌌 TEMA GALAXY - Galaxia con estrellas y agujero negro
// ============================================

export function createGalaxyAnimation(ctx, canvas) {
    const createGalaxy = () => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const densityFactor = Math.min(canvas.width, canvas.height) / 800;

        return {
            stars: Array.from({ length: 120 * densityFactor }, () => ({
                angle: Math.random() * Math.PI * 2,
                radius: 60 + Math.random() * (canvas.width * 0.6),
                speed: 0.0004 + Math.random() * 0.0015,
                size: 0.5 + Math.random() * 2,
                hue: 200 + Math.random() * 160
            })),
            particles: Array.from({ length: 70 * densityFactor }, () => ({
                angle: Math.random() * Math.PI * 2,
                radius: 80 + Math.random() * (canvas.width * 0.5),
                speed: 0.002 + Math.random() * 0.004,
                size: 1 + Math.random() * 2.5,
                life: Math.random()
            })),
            shootingStars: [],
            centerX,
            centerY
        };
    };

    let galaxy = createGalaxy();
    let rotation = 0;
    let time = 0;

    const animate = () => {
        const { centerX, centerY } = galaxy;
        rotation += 0.002;
        time += 0.01;

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Nebulosa
        for (let i = 0; i < 2; i++) {
            const x = centerX + Math.sin(time * 0.2 + i) * 150;
            const y = centerY + Math.cos(time * 0.15 + i) * 120;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 280);
            gradient.addColorStop(0, `hsla(${260 + i * 40},100%,60%,0.05)`);
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Estrellas
        galaxy.stars.forEach(s => {
            s.angle += s.speed;
            let x = centerX + Math.cos(s.angle + rotation) * s.radius;
            let y = centerY + Math.sin(s.angle + rotation) * s.radius;

            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 220) {
                const force = (220 - dist) / 220;
                x -= dx * force * 0.8;
                y -= dy * force * 0.8;
            }

            ctx.beginPath();
            ctx.arc(x, y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue},100%,85%,1)`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${s.hue},100%,70%,1)`;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Partículas
        galaxy.particles.forEach(p => {
            p.angle += p.speed;
            p.radius -= 0.5;
            let x = centerX + Math.cos(p.angle) * p.radius;
            let y = centerY + Math.sin(p.angle) * p.radius;

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${p.life})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#ffffff";
            ctx.fill();
            ctx.shadowBlur = 0;

            if (p.radius < 25) {
                p.radius = 80 + Math.random() * (canvas.width * 0.5);
                p.angle = Math.random() * Math.PI * 2;
                p.life = Math.random();
            }
        });

        // Shooting stars
        if (Math.random() < 0.008) {
            galaxy.shootingStars.push({
                x: Math.random() * canvas.width,
                y: 0,
                vx: -3 - Math.random() * 2,
                vy: 3 + Math.random() * 3,
                life: 1
            });
        }

        galaxy.shootingStars.forEach((s, i) => {
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.02;

            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 5, s.y - s.vy * 5);
            ctx.strokeStyle = `rgba(255,255,255,${s.life})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            if (s.life <= 0) galaxy.shootingStars.splice(i, 1);
        });

        // Agujero negro
        const pulse = 90 + Math.sin(time * 2) * 6;
        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, pulse);
        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(0.6, "rgba(0,0,0,0.95)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        return requestAnimationFrame(animate);
    };

    return animate;
}