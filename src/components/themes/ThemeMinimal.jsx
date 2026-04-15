// ============================================
// ⭕ TEMA MINIMAL - Círculos minimalistas
// ============================================

export function createMinimalAnimation(ctx, canvas) {
    const particles = Array.from({ length: 8 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 30 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: 0.03 + Math.random() * 0.05
    }));

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < -p.size) p.x = canvas.width + p.size;
            if (p.x > canvas.width + p.size) p.x = -p.size;
            if (p.y < -p.size) p.y = canvas.height + p.size;
            if (p.y > canvas.height + p.size) p.y = -p.size;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,0,0,${p.alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        return requestAnimationFrame(animate);
    };

    return animate;
}

// ============================================
// ❓ TEMA DEFAULT - Partículas simples
// ============================================

export function createDefaultAnimation(ctx, canvas) {
    const particles = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: 0.1 + Math.random() * 0.2
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
            ctx.fillStyle = `rgba(255,105,180,${p.alpha})`;
            ctx.fill();
        });
        return requestAnimationFrame(animate);
    };

    return animate;
}