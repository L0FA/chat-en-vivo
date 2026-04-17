// ============================================
// ⭕ TEMA MINIMAL - Círculos minimalistas
// ============================================

export function createMinimalAnimation(ctx, canvas) {
    let animId = null;
    const circles = Array.from({ length: 6 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 20 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
    }));

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        circles.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;
            if (c.x < -c.size || c.x > canvas.width + c.size) c.vx *= -1;
            if (c.y < -c.size || c.y > canvas.height + c.size) c.vy *= -1;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(0,0,0,0.05)";
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animId) cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
}

export function createDefaultAnimation(ctx, canvas) {
    let animId = null;
    const particles = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
    }));

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,105,180,0.5)";
            ctx.fill();
        });
        animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animId) cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
}