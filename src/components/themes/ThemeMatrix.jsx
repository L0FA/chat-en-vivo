// ============================================
// 💻 TEMA MATRIX - Matrix rain
// ============================================

export function createMatrixAnimation(ctx, canvas) {
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

    // Silueta (centro pantalla)
    const silhouette = (x, y) => {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const dx = (x - cx) / 120;
        const dy = (y - cy) / 180;
        const head = dx * dx + (dy + 0.8) * (dy + 0.8) < 0.15;
        const body = Math.abs(dx) < 0.3 && dy > -0.5 && dy < 0.6;
        const shoulders = Math.abs(dx) < 0.6 && dy > -0.3 && dy < 0;
        return head || body || shoulders;
    };

    // Texto oculto
    const hiddenTexts = ["WAKE UP", "FOLLOW THE WHITE RABBIT", "SYSTEM FAILURE"];

    const animate = () => {
        frame++;
        ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px monospace`;

        drops.forEach(drop => {
            const wave = Math.sin(frame * 0.02 + drop.phase) * 10 * drop.depth;

            for (let i = 0; i < drop.length; i++) {
                let char = chars[Math.floor(Math.random() * chars.length)];
                const y = (drop.y - i) * fontSize;
                const x = drop.x + wave;
                const alpha = 1 - i / drop.length;
                let brightnessBoost = 0;

                if (silhouette(x, y)) brightnessBoost = 0.8;

                const textIndex = Math.floor(frame / 600) % hiddenTexts.length;
                const text = hiddenTexts[textIndex];
                const textX = canvas.width / 2 - (text.length * fontSize) / 2;
                const textY = canvas.height * 0.75;
                const charIndex = Math.floor((x - textX) / fontSize);

                if (y > textY - 20 && y < textY + 20 && charIndex >= 0 && charIndex < text.length) {
                    char = text[charIndex];
                    brightnessBoost = 1;
                }

                if (i === 0) {
                    ctx.fillStyle = `rgba(200,255,200,${1 + brightnessBoost})`;
                    ctx.shadowBlur = 20 + brightnessBoost * 20;
                    ctx.shadowColor = "#00ffcc";
                } else {
                    ctx.fillStyle = `rgba(0,255,120,${alpha * (0.7 + brightnessBoost)})`;
                    ctx.shadowBlur = 0;
                }
                ctx.fillText(char, x, y);
            }

            drop.y += drop.speed;
            if (drop.y * fontSize > canvas.height && Math.random() > 0.97) {
                drop.y = Math.random() * -50;
                drop.speed = 1 + Math.random() * 2;
                drop.length = 15 + Math.random() * 35;
                drop.phase = Math.random() * Math.PI * 2;
            }
        });

        // Glitch
        if (frame % 120 === 0) {
            const y = Math.random() * canvas.height;
            const h = 10 + Math.random() * 20;
            ctx.globalAlpha = 0.2;
            ctx.drawImage(canvas, 0, y, canvas.width, h, (Math.random() - 0.5) * 30, y, canvas.width, h);
            ctx.globalAlpha = 1;
        }

        // Flash
        if (Math.random() < 0.0015) {
            ctx.fillStyle = "rgba(0,255,150,0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        return requestAnimationFrame(animate);
    };

    return animate;
}