// ============================================
// 💻 TEMA MATRIX - Matrix rain con glitch
// ============================================

export function createMatrixAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const fontSize = 15;
    const columns = Math.floor(canvas.width / fontSize);
    const chars = "アイウエオカキクケコ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const drops = Array.from({ length: columns }, (_, i) => ({
        y: Math.random() * -90,
        speed: 0.9 + Math.random() * 1.8,
        length: 14 + Math.random() * 32,
        x: i * fontSize,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random(),
    }));

    let frame = 0;

    const animate = () => {
        if (stopped) return;
        frame++;
        ctx.fillStyle = "rgba(0, 0, 0, 0.055)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px monospace`;

        drops.forEach(drop => {
            const wave = Math.sin(frame * 0.018 + drop.phase) * 9 * drop.depth;

            for (let i = 0; i < drop.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const y = (drop.y - i) * fontSize;
                const x = drop.x + wave;
                const alpha = 1 - i / drop.length;

                if (i === 0) {
                    ctx.fillStyle = "rgba(200,255,200,1)";
                    ctx.shadowBlur = 18;
                    ctx.shadowColor = "#00ff80";
                } else {
                    ctx.fillStyle = `rgba(0,255,115,${alpha})`;
                    ctx.shadowBlur = 0;
                }
                ctx.fillText(char, x, y);
            }

            drop.y += drop.speed;
            if (drop.y * fontSize > canvas.height && Math.random() > 0.97) {
                drop.y = Math.random() * -45;
            }
        });

        if (frame % 115 === 0) {
            const y = Math.random() * canvas.height;
            const h = 9 + Math.random() * 16;
            ctx.globalAlpha = 0.15;
            ctx.drawImage(canvas, 0, y, canvas.width, h, (Math.random() - 0.5) * 25, y, canvas.width, h);
            ctx.globalAlpha = 1;
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