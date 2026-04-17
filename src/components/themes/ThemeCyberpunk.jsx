// ============================================
// 🤖 TEMA CYBERPUNK - Nodos, líneas y glitch
// ============================================

export function createCyberpunkAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let glitchFrame = 0;

    const particles = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: 45 + Math.random() * 160,
        dir: Math.random() > 0.5 ? "h" : "v",
        alpha: 0,
        fadeIn: true
    }));

    const nodes = Array.from({ length: 18 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 3,
        pulse: Math.random() * Math.PI * 2
    }));

    const animate = () => {
        if (stopped) return;
        ctx.fillStyle = "rgba(10,0,22,0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        nodes.forEach(n => {
            n.pulse += 0.05;
            const sizeMod = (Math.sin(n.pulse) + 1) / 2;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.size + sizeMod * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,0,128,0.22)";
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#ff0080";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        particles.forEach(p => {
            p.alpha += p.fadeIn ? 0.018 : -0.018;
            if (p.alpha >= 1) p.fadeIn = false;
            if (p.alpha <= 0) {
                p.fadeIn = true;
                p.x = Math.random() * canvas.width;
                p.y = Math.random() * canvas.height;
            }
            ctx.strokeStyle = `rgba(255,0,128,${p.alpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            if (p.dir === "h") {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.length, p.y);
            } else {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, p.y + p.length);
            }
            ctx.stroke();
        });

        glitchFrame++;
        if (glitchFrame % 110 === 0) {
            const y = Math.random() * canvas.height;
            const h = 9 + Math.random() * 18;
            ctx.globalAlpha = 0.18;
            ctx.drawImage(canvas, 0, y, canvas.width, h, (Math.random() - 0.5) * 28, y, canvas.width, h);
            ctx.globalAlpha = 1;
        }

        if (Math.random() < 0.0012) {
            ctx.fillStyle = "rgba(255,0,140,0.18)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

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