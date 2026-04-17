// ============================================
// 🌌 TEMA GALAXY - Galaxia con черная дыра y efecto succion
// ============================================

export function createGalaxyAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const createGalaxy = () => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const densityFactor = Math.min(canvas.width, canvas.height) / 700;

        return {
            stars: Array.from({ length: 140 * densityFactor }, () => ({
                angle: Math.random() * Math.PI * 2,
                radius: 50 + Math.random() * (canvas.width * 0.55),
                speed: 0.00035 + Math.random() * 0.0014,
                size: 0.4 + Math.random() * 1.8,
                hue: 200 + Math.random() * 160
            })),
            particles: Array.from({ length: 80 * densityFactor }, () => ({
                angle: Math.random() * Math.PI * 2,
                radius: 70 + Math.random() * (canvas.width * 0.45),
                speed: 0.0018 + Math.random() * 0.0035,
                size: 0.9 + Math.random() * 2.2,
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
        if (stopped) return;
        const { centerX, centerY } = galaxy;
        rotation += 0.0018;
        time += 0.008;

        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 2; i++) {
            const x = centerX + Math.sin(time * 0.18 + i) * 130;
            const y = centerY + Math.cos(time * 0.13 + i) * 105;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 250);
            gradient.addColorStop(0, `hsla(${255 + i * 35},100%,55%,0.04)`);
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const blackHoleRadius = 25;

        galaxy.stars.forEach(s => {
            s.angle += s.speed;
            let x = centerX + Math.cos(s.angle + rotation) * s.radius;
            let y = centerY + Math.sin(s.angle + rotation) * s.radius;

            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 220) {
                const force = Math.pow((220 - dist) / 220, 1.5);
                const suctionSpeed = 0.35;
                x -= dx * force * suctionSpeed;
                y -= dy * force * suctionSpeed;

                if (dist < blackHoleRadius * 2.5) {
                    s.radius = 60 + Math.random() * (canvas.width * 0.5);
                    s.angle = Math.random() * Math.PI * 2;
                    s.speed = 0.0004 + Math.random() * 0.0015;
                }

                const fadeAlpha = Math.max(0, (dist - blackHoleRadius) / (blackHoleRadius * 2));
                ctx.globalAlpha = fadeAlpha;
            }

            ctx.beginPath();
            ctx.arc(x, y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue},100%,82%,1)`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = `hsla(${s.hue},100%,65%,1)`;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });

        galaxy.particles.forEach(p => {
            p.angle += p.speed;
            p.radius -= 0.45;
            let x = centerX + Math.cos(p.angle) * p.radius;
            let y = centerY + Math.sin(p.angle) * p.radius;

            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${p.life})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ffffff";
            ctx.fill();
            ctx.shadowBlur = 0;

            if (p.radius < 22) {
                p.radius = 70 + Math.random() * (canvas.width * 0.45);
                p.angle = Math.random() * Math.PI * 2;
                p.life = Math.random();
            }
        });

        if (Math.random() < 0.007) {
            galaxy.shootingStars.push({
                x: Math.random() * canvas.width,
                y: 0,
                vx: -2.8 - Math.random() * 1.8,
                vy: 2.8 + Math.random() * 2.8,
                life: 1
            });
        }

        galaxy.shootingStars.forEach((ss, index) => {
            ss.x += ss.vx;
            ss.y += ss.vy;
            ss.life -= 0.025;

            if (ss.life <= 0) {
                galaxy.shootingStars.splice(index, 1);
                return;
            }

            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(ss.x - ss.vx * 4, ss.y - ss.vy * 4);
            ctx.strokeStyle = `rgba(255,255,255,${ss.life})`;
            ctx.lineWidth = 1.8;
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