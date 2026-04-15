// ============================================
// 🤖 TEMA CYBERPUNK - Nodos y líneas
// ============================================

export function createCyberpunkAnimation(ctx, canvas) {
    const particles = Array.from({ length: 20 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: 50 + Math.random() * 150,
        speed: 1 + Math.random() * 3,
        dir: Math.random() > 0.5 ? "h" : "v",
        alpha: 0,
        fadeIn: true
    }));

    const animate = () => {
        ctx.fillStyle = "rgba(13,0,26,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Nodos
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,0,128,0.25)";
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#ff0080";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Líneas
        particles.forEach(p => {
            p.alpha += p.fadeIn ? 0.02 : -0.02;
            if (p.alpha >= 1) p.fadeIn = false;
            if (p.alpha <= 0) {
                p.fadeIn = true;
                p.x = Math.random() * canvas.width;
                p.y = Math.random() * canvas.height;
            }
            ctx.strokeStyle = `rgba(255,0,128,${p.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#ff0080";
            ctx.beginPath();
            if (p.dir === "h") {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.length, p.y);
            } else {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, p.y + p.length);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        return requestAnimationFrame(animate);
    };

    return animate;
}