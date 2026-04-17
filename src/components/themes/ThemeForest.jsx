// ============================================
// 🌲 TEMA FOREST - Estilo chat-en-vivo (fondo claro)
// ============================================

export function createForestAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let wind = 0;
    let time = 0;

    const forestLayers = [
        { depth: 0.2, count: 8 },
        { depth: 0.5, count: 12 },
        { depth: 1, count: 16 }
    ];

    const trees = forestLayers.flatMap(layer =>
        Array.from({ length: layer.count }, () => ({
            x: Math.random() * canvas.width,
            depth: layer.depth,
            height: canvas.height * (0.3 + Math.random() * 0.5),
            swayOffset: Math.random() * Math.PI
        }))
    );

    const fireflies = Array.from({ length: 20 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        pulse: Math.random() * Math.PI * 2
    }));

    const drawTree = (t, sway) => {
        const x = t.x + sway;
        const baseY = canvas.height;
        const trunkWidth = 4 + t.depth * 10;
        const trunkHeight = t.height;
        const baseX = x + trunkWidth / 2;

        ctx.fillStyle = "#14331f";
        ctx.fillRect(x, baseY - trunkHeight, trunkWidth, trunkHeight);

        const layers = 3 + Math.floor(t.depth * 2);
        for (let i = 0; i < layers; i++) {
            const variation = 0.85 + Math.sin(t.swayOffset + i) * 0.1;
            const width = (45 + t.depth * 90) * (1 - i * 0.26) * variation;
            const height = 18 + t.depth * 10;
            const yOffset = i * (height * 0.6);

            ctx.beginPath();
            ctx.moveTo(baseX, baseY - trunkHeight - yOffset - height);
            ctx.lineTo(baseX - width / 2, baseY - trunkHeight - yOffset);
            ctx.lineTo(baseX + width / 2, baseY - trunkHeight - yOffset);
            ctx.closePath();

            const shade = Math.floor(45 + t.depth * 50 - i * 8);
            ctx.fillStyle = `rgb(${shade}, ${shade + 20}, ${shade})`;
            ctx.fill();
        }
    };

    const animate = () => {
        if (stopped) return;
        wind += 0.004;
        time += 0.006;

        // Fondo estilo chat-en-vivo - gradiente claro SIN opacidad
        ctx.fillStyle = "#f1fbf3";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#dff2e2");
        gradient.addColorStop(1, "#f1fbf3");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        trees.forEach(t => {
            const windFactor = Math.sin(wind + t.swayOffset) * (2 + t.depth * 5);
            drawTree(t, windFactor);
        });

        fireflies.forEach(f => {
            f.x += f.vx + Math.sin(time + f.y * 0.006) * 0.08;
            f.y += f.vy;
            f.pulse += 0.035;
            const bright = Math.sin(f.pulse) > 0;

            if (f.x < 0) f.x = canvas.width;
            if (f.x > canvas.width) f.x = 0;
            if (f.y < 0) f.y = canvas.height;
            if (f.y > canvas.height) f.y = 0;

            ctx.fillStyle = bright ? "#22c55e" : "#16a34a";
            ctx.beginPath();
            ctx.arc(f.x, f.y, 1.2, 0, Math.PI * 2);
            ctx.fill();
        });

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