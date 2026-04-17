// ============================================
// 💻 TEMA MATRIX - Matrix rain
// ============================================

export function createMatrixAnimation(ctx, canvas) {
    let animId = null;
    
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const chars = "アイウエオカキクケコ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const drops = Array.from({ length: columns }, (_, i) => ({
        y: Math.random() * -100,
        speed: 1 + Math.random() * 2,
        length: 15 + Math.random() * 35,
        x: i * fontSize,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random(),
    }));

    let frame = 0;

    const animate = () => {
        frame++;
        ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px monospace`;

        drops.forEach(drop => {
            const wave = Math.sin(frame * 0.02 + drop.phase) * 10 * drop.depth;
            for (let i = 0; i < drop.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const y = (drop.y - i) * fontSize;
                const x = drop.x + wave;
                const alpha = 1 - i / drop.length;
                ctx.fillStyle = i === 0 ? "rgba(200,255,200,1)" : `rgba(0,255,120,${alpha})`;
                ctx.fillText(char, x, y);
            }
            drop.y += drop.speed;
            if (drop.y * fontSize > canvas.height && Math.random() > 0.97) {
                drop.y = Math.random() * -50;
            }
        });

        animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animId) cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
}