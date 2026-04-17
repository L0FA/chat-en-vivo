// ============================================
// 🔥 TEMA FIRE - Fuego realista con llamas
// ============================================

export function createFireAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const fireFlames = Array.from({ length: 55 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height,
        height: 100 + Math.random() * 220,
        width: 5 + Math.random() * 12,
        life: 0.55 + Math.random() * 0.45,
        decay: 0.003 + Math.random() * 0.01,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        offsetRatio: Math.random(),
        hue: 18 + Math.random() * 25
    }));

    const fireParticles = Array.from({ length: 45 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 80,
        size: 2 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(1.2 + Math.random() * 2),
        life: 0.4 + Math.random() * 0.5,
        decay: 0.004 + Math.random() * 0.012
    }));

    const embers = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height,
        size: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(1 + Math.random() * 2),
        life: 0.35 + Math.random() * 0.45,
        decay: 0.005 + Math.random() * 0.012
    }));

    let wind = 0;

    const animate = () => {
        if (stopped) return;
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        wind += 0.005;

        fireFlames.forEach(flame => {
            flame.life -= flame.decay;
            flame.wobble += flame.wobbleSpeed;
            const x = flame.x + Math.sin(flame.wobble) * (flame.life * 5 + flame.offsetRatio * 3);
            const currentHeight = flame.height * flame.life;
            
            const grad = ctx.createLinearGradient(x, canvas.height, x, canvas.height - currentHeight);
            grad.addColorStop(0, `hsla(${flame.hue + 35}, 100%, 65%, ${flame.life})`);
            grad.addColorStop(0.35, `hsla(${flame.hue + 15}, 100%, 58%, ${flame.life * 0.9})`);
            grad.addColorStop(0.65, `hsla(${flame.hue}, 100%, 52%, ${flame.life * 0.65})`);
            grad.addColorStop(1, `hsla(${flame.hue - 12}, 100%, 42%, 0)`);
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - flame.width * 0.5, canvas.height);
            ctx.quadraticCurveTo(x - flame.width * 0.5, canvas.height - currentHeight * 0.5, x, canvas.height - currentHeight);
            ctx.quadraticCurveTo(x + flame.width * 0.5, canvas.height - currentHeight * 0.5, x + flame.width * 0.5, canvas.height);
            ctx.closePath();
            ctx.fill();

            if (flame.life <= 0 || flame.y < canvas.height * 0.1) {
                flame.x = Math.random() * canvas.width;
                flame.y = canvas.height;
                flame.life = 1;
                flame.height = 100 + Math.random() * 220;
                flame.wobble = Math.random() * Math.PI * 2;
            }
        });

        fireParticles.forEach(p => {
            p.life -= p.decay;
            p.x += p.vx + Math.sin(wind + p.y * 0.005) * 0.2;
            p.y += p.vy;
            p.size *= 1.006;

            if (p.life <= 0 || p.y < canvas.height * 0.15) {
                p.x = Math.random() * canvas.width;
                p.y = canvas.height + Math.random() * 50;
                p.life = 1;
                p.size = 2 + Math.random() * 5;
                p.vy = -(1.2 + Math.random() * 2);
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

        embers.forEach(e => {
            e.life -= e.decay;
            e.x += e.vx + Math.sin(wind + e.y * 0.02);
            e.y += e.vy;

            if (e.life <= 0 || e.y < canvas.height * 0.12) {
                e.x = Math.random() * canvas.width;
                e.y = canvas.height;
                e.life = 1;
            }

            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,200,70,${e.life})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "orange";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        const baseGrad = ctx.createLinearGradient(0, canvas.height * 0.72, 0, canvas.height);
        baseGrad.addColorStop(0, "rgba(255,50,0,0)");
        baseGrad.addColorStop(1, "rgba(255,50,0,0.28)");
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, canvas.height * 0.72, canvas.width, canvas.height * 0.28);

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