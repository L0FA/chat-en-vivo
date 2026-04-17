// ============================================
// 🔥 TEMA FIRE - Fuego realista con chispas
// ============================================

export function createFireAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const fireLines = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height,
        height: 80 + Math.random() * 180,
        width: 4 + Math.random() * 8,
        life: 0.6 + Math.random() * 0.4,
        speed: 1.8 + Math.random() * 2.5,
        decay: 0.004 + Math.random() * 0.012,
        wobble: Math.random() * Math.PI * 2,
        hue: 20 + Math.random() * 30
    }));

    const fireParticles = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 80,
        size: 2 + Math.random() * 6,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(1.5 + Math.random() * 2.5),
        life: 0.5 + Math.random() * 0.5,
        decay: 0.005 + Math.random() * 0.015
    }));

    const smokeParticles = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height,
        size: 12 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.4 + Math.random() * 0.8),
        alpha: 0.15 + Math.random() * 0.25,
        decay: 0.0015 + Math.random() * 0.003
    }));

    const embers = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height,
        size: 0.8 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 1.8,
        vy: -(1.2 + Math.random() * 2.5),
        life: 0.4 + Math.random() * 0.5,
        decay: 0.006 + Math.random() * 0.015
    }));

    let wind = 0;

    const animate = () => {
        if (stopped) return;
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        wind += 0.006;

        fireLines.forEach(line => {
            line.life -= line.decay;
            line.wobble += 0.025;
            const x = line.x + Math.sin(line.wobble) * (line.life * 8);
            const currentHeight = line.height * line.life;
            
            const grad = ctx.createLinearGradient(x, canvas.height, x, canvas.height - currentHeight);
            grad.addColorStop(0, `hsla(${line.hue + 30}, 100%, 60%, ${line.life})`);
            grad.addColorStop(0.4, `hsla(${line.hue + 10}, 100%, 55%, ${line.life * 0.85})`);
            grad.addColorStop(0.7, `hsla(${line.hue - 5}, 100%, 50%, ${line.life * 0.6})`);
            grad.addColorStop(1, `hsla(${line.hue - 15}, 100%, 40%, 0)`);
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - line.width, canvas.height);
            ctx.quadraticCurveTo(x - line.width * 0.3, canvas.height - currentHeight * 0.6, x, canvas.height - currentHeight);
            ctx.quadraticCurveTo(x + line.width * 0.3, canvas.height - currentHeight * 0.6, x + line.width, canvas.height);
            ctx.closePath();
            ctx.fill();

            if (line.life <= 0 || line.y < canvas.height * 0.15) {
                line.x = Math.random() * canvas.width;
                line.y = canvas.height;
                line.life = 1;
                line.height = 80 + Math.random() * 180;
                line.wobble = Math.random() * Math.PI * 2;
            }
        });

        fireParticles.forEach(p => {
            p.life -= p.decay;
            p.x += p.vx + Math.sin(wind + p.y * 0.006) * 0.25;
            p.y += p.vy;
            p.size *= 1.008;

            if (p.life <= 0 || p.y < canvas.height * 0.18) {
                p.x = Math.random() * canvas.width;
                p.y = canvas.height + Math.random() * 60;
                p.life = 1;
                p.size = 2 + Math.random() * 6;
                p.vy = -(1.5 + Math.random() * 2.5);
            }

            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            gradient.addColorStop(0, `rgba(255,255,180,${p.life})`);
            gradient.addColorStop(0.3, `rgba(255,150,0,${p.life * 0.9})`);
            gradient.addColorStop(0.6, `rgba(255,60,0,${p.life * 0.7})`);
            gradient.addColorStop(1, "rgba(0,0,0,0)");

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });

        smokeParticles.forEach(s => {
            s.y += s.vy;
            s.x += s.vx + Math.sin(wind + s.y * 0.015) * 0.2;
            s.alpha -= s.decay;
            s.size *= 1.008;

            if (s.alpha <= 0 || s.y < canvas.height * 0.15) {
                s.x = Math.random() * canvas.width;
                s.y = canvas.height;
                s.alpha = 0.35;
                s.size = 15 + Math.random() * 25;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(80,80,80,${s.alpha})`;
            ctx.fill();
        });

        embers.forEach(e => {
            e.life -= e.decay;
            e.x += e.vx + Math.sin(wind + e.y * 0.025);
            e.y += e.vy;

            if (e.life <= 0 || e.y < canvas.height * 0.15) {
                e.x = Math.random() * canvas.width;
                e.y = canvas.height;
                e.life = 1;
            }

            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,200,80,${e.life})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "orange";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        const baseGradient = ctx.createLinearGradient(0, canvas.height * 0.75, 0, canvas.height);
        baseGradient.addColorStop(0, "rgba(255,60,0,0)");
        baseGradient.addColorStop(1, "rgba(255,60,0,0.3)");
        ctx.fillStyle = baseGradient;
        ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);

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