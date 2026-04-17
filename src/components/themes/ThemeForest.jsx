// ============================================
// 🌲 TEMA FOREST - Bosques procedurales (SIN opacidad)
// ============================================

export function createForestAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let wind = 0;
    let time = 0;

    const forestLayers = [
        { depth: 0.2, count: 10 },
        { depth: 0.5, count: 14 },
        { depth: 1, count: 18 }
    ];

    const trees = forestLayers.flatMap(layer =>
        Array.from({ length: layer.count }, () => ({
            x: Math.random() * canvas.width,
            depth: layer.depth,
            height: canvas.height * (0.3 + Math.random() * 0.55),
            swayOffset: Math.random() * Math.PI
        }))
    );

    const fireflies = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        pulse: Math.random() * Math.PI * 2
    }));

    const leaves = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 5 + Math.random() * 10,
        speed: 0.15 + Math.random() * 0.8,
        wobble: Math.random() * Math.PI * 2,
        depth: Math.random()
    }));

    const drawTree = (t, sway) => {
        const x = t.x + sway;
        const baseY = canvas.height;
        const trunkWidth = 4 + t.depth * 12;
        const trunkHeight = t.height;
        const baseX = x + trunkWidth / 2;

        ctx.fillStyle = "#080808";
        ctx.fillRect(x, baseY - trunkHeight, trunkWidth, trunkHeight);

        const layers = 3 + Math.floor(t.depth * 3);
        for (let i = 0; i < layers; i++) {
            const variation = 0.85 + Math.sin(t.swayOffset + i) * 0.1;
            const width = (55 + t.depth * 110) * (1 - i * 0.28) * variation;
            const height = 20 + t.depth * 12;
            const yOffset = i * (height * 0.65);

            ctx.beginPath();
            ctx.moveTo(baseX, baseY - trunkHeight - yOffset - height);
            ctx.lineTo(baseX - width / 2, baseY - trunkHeight - yOffset);
            ctx.lineTo(baseX + width / 2, baseY - trunkHeight - yOffset);
            ctx.closePath();

            const shade = Math.floor(15 + t.depth * 35 - i * 5);
            ctx.fillStyle = `rgb(${shade}, ${shade + 8}, ${shade})`;
            ctx.fill();
        }
    };

    const animate = () => {
        if (stopped) return;
        wind += 0.005 + Math.sin(time * 0.25) * 0.002;
        time += 0.008;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#050a05";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        trees.forEach(t => {
            const windFactor = Math.sin(wind + t.swayOffset) * (2.5 + t.depth * 7);
            drawTree(t, windFactor);
        });

        fireflies.forEach(f => {
            f.x += f.vx + Math.sin(time + f.y * 0.008) * 0.1;
            f.y += f.vy;
            f.pulse += 0.04;
            const bright = Math.sin(f.pulse) > 0;

            if (f.x < 0) f.x = canvas.width;
            if (f.x > canvas.width) f.x = 0;
            if (f.y < 0) f.y = canvas.height;
            if (f.y > canvas.height) f.y = 0;

            ctx.fillStyle = bright ? "#88ff55" : "#44aa33";
            ctx.beginPath();
            ctx.arc(f.x, f.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });

        leaves.forEach(l => {
            l.y += l.speed * (0.35 + l.depth);
            l.wobble += 0.012;
            l.x += Math.sin(l.wobble + wind) * (0.5 + l.depth * 1.5);

            if (l.y > canvas.height) {
                l.y = -15;
                l.x = Math.random() * canvas.width;
            }

            ctx.fillStyle = "#1a2a1a";
            ctx.beginPath();
            ctx.arc(l.x, l.y, l.size * 0.2, 0, Math.PI * 2);
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