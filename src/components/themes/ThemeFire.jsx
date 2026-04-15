// ============================================
// 🔥 TEMA FIRE - Fuego, humo y chispas
// ============================================

export function createFireAnimation(ctx, canvas) {
    const fireParticles = Array.from({ length: 130 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        size: 4 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(2 + Math.random() * 4),
        life: 0.8 + Math.random() * 0.5,
        decay: 0.008 + Math.random() * 0.02
    }));

    const smokeParticles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height,
        size: 10 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.5 + Math.random() * 1),
        alpha: 0.2 + Math.random() * 0.3,
        decay: 0.002 + Math.random() * 0.004
    }));

    const embers = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height,
        size: 1 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 2,
        vy: -(1 + Math.random() * 3),
        life: 0.5 + Math.random() * 0.5,
        decay: 0.01 + Math.random() * 0.02
    }));

    let wind = 0;

    const animate = () => {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        wind += 0.01;

        // FIRE
        fireParticles.forEach(p => {
            p.life -= p.decay;
            p.x += p.vx + Math.sin(wind + p.y * 0.01) * 0.3;
            p.y += p.vy;
            p.size *= 1.01;

            if (p.life <= 0 || p.y < canvas.height * 0.25) {
                p.x = Math.random() * canvas.width;
                p.y = canvas.height + Math.random() * 100;
                p.life = 1;
                p.size = 4 + Math.random() * 10;
                p.vy = -(2 + Math.random() * 4);
            }

            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            gradient.addColorStop(0, `rgba(255,255,180,${p.life})`);
            gradient.addColorStop(0.3, `rgba(255,150,0,${p.life * 0.9})`);
            gradient.addColorStop(0.6, `rgba(255,60,0,${p.life * 0.7})`);
            gradient.addColorStop(1, `rgba(0,0,0,0)`);

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });

        // SMOKE
        smokeParticles.forEach(s => {
            s.y += s.vy;
            s.x += s.vx + Math.sin(wind + s.y * 0.02) * 0.2;
            s.alpha -= s.decay;
            s.size *= 1.01;

            if (s.alpha <= 0 || s.y < canvas.height * 0.2) {
                s.x = Math.random() * canvas.width;
                s.y = canvas.height;
                s.alpha = 0.3;
                s.size = 10 + Math.random() * 20;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(120,120,120,${s.alpha})`;
            ctx.fill();
        });

        // EMBERS
        embers.forEach(e => {
            e.life -= e.decay;
            e.x += e.vx + Math.sin(wind + e.y * 0.03);
            e.y += e.vy;

            if (e.life <= 0 || e.y < canvas.height * 0.2) {
                e.x = Math.random() * canvas.width;
                e.y = canvas.height;
                e.life = 1;
            }

            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,200,100,${e.life})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "orange";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // BASE GLOW
        const baseGradient = ctx.createLinearGradient(0, canvas.height * 0.8, 0, canvas.height);
        baseGradient.addColorStop(0, "rgba(255,80,0,0)");
        baseGradient.addColorStop(1, "rgba(255,80,0,0.25)");
        ctx.fillStyle = baseGradient;
        ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);

        return requestAnimationFrame(animate);
    };

    return animate;
}