// ============================================
// 🌲 TEMA FOREST - Bosques con luciérnagas
// ============================================

export function createForestAnimation(ctx, canvas) {
    let wind = 0;
    let time = 0;

    const forestLayers = [
        { depth: 0.2, count: 8, color: "rgba(10,20,10,0.15)" },
        { depth: 0.5, count: 12, color: "rgba(20,40,20,0.25)" },
        { depth: 1, count: 16, color: "rgba(30,60,30,0.35)" }
    ];

    const trees = forestLayers.flatMap(layer =>
        Array.from({ length: layer.count }, () => ({
            x: Math.random() * canvas.width,
            depth: layer.depth,
            height: canvas.height * (0.35 + Math.random() * 0.5),
            swayOffset: Math.random() * Math.PI,
            layer
        }))
    );

    const fireflies = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        pulse: Math.random() * Math.PI * 2
    }));

    const leaves = Array.from({ length: 28 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 6 + Math.random() * 10,
        speed: 0.2 + Math.random() * 0.9,
        wobble: Math.random() * Math.PI * 2,
        depth: Math.random()
    }));

    const drawTree = (t, sway) => {
        const x = t.x + sway;
        const baseY = canvas.height;
        const trunkWidth = 5 + t.depth * 10;
        const trunkHeight = t.height;
        const baseX = x + trunkWidth / 2;

        ctx.fillStyle = `rgba(15,25,15,${0.2 + t.depth * 0.5})`;
        ctx.fillRect(x, baseY - trunkHeight, trunkWidth, trunkHeight);

        const layers = 3 + Math.floor(t.depth * 3);
        for (let i = 0; i < layers; i++) {
            const variation = 0.85 + Math.sin(t.swayOffset + i) * 0.1;
            const width = (60 + t.depth * 100) * (1 - i * 0.28) * variation;
            const height = 22 + t.depth * 12;
            const yOffset = i * (height * 0.65);

            ctx.beginPath();
            ctx.moveTo(baseX, baseY - trunkHeight - yOffset - height);
            ctx.lineTo(baseX - width / 2, baseY - trunkHeight - yOffset);
            ctx.lineTo(baseX + width / 2, baseY - trunkHeight - yOffset);
            ctx.closePath();

            const shade = 25 + t.depth * 45 - i * 6;
            ctx.fillStyle = `rgba(20, ${shade}, 20, ${0.2 + t.depth * 0.45})`;
            ctx.fill();
        }
    };

    const animate = () => {
        wind += 0.006 + Math.sin(time * 0.3) * 0.002;
        time += 0.01;

        ctx.fillStyle = "rgba(5,12,5,0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        forestLayers.forEach((layer, i) => {
            const fogY = canvas.height * (0.5 + i * 0.15);
            const fog = ctx.createLinearGradient(0, fogY, 0, canvas.height);
            fog.addColorStop(0, "rgba(200,255,200,0)");
            fog.addColorStop(1, layer.color);
            ctx.fillStyle = fog;
            ctx.fillRect(0, fogY, canvas.width, canvas.height);
        });

        const topFog = ctx.createLinearGradient(0, 0, 0, canvas.height);
        topFog.addColorStop(0, "rgba(200,255,200,0.02)");
        topFog.addColorStop(0.5, "rgba(0,0,0,0)");
        topFog.addColorStop(1, "rgba(0,0,0,0.25)");
        ctx.fillStyle = topFog;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        trees.forEach(t => {
            const windFactor = Math.sin(wind + t.swayOffset) * (3 + t.depth * 8);
            drawTree(t, windFactor);
        });

        fireflies.forEach(f => {
            f.x += f.vx + Math.sin(time + f.y * 0.01) * 0.15;
            f.y += f.vy;
            f.pulse += 0.05;
            const glow = (Math.sin(f.pulse) + 1) / 2;

            if (f.x < 0) f.x = canvas.width;
            if (f.x > canvas.width) f.x = 0;
            if (f.y < 0) f.y = canvas.height;
            if (f.y > canvas.height) f.y = 0;

            ctx.beginPath();
            ctx.arc(f.x, f.y, 1.5 + glow * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180,255,120,${0.25 + glow * 0.6})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(180,255,120,0.6)";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        leaves.forEach(l => {
            l.y += l.speed * (0.4 + l.depth);
            l.wobble += 0.015;
            l.x += Math.sin(l.wobble + wind) * (0.8 + l.depth * 2);

            if (l.y > canvas.height) {
                l.y = -20;
                l.x = Math.random() * canvas.width;
            }

            ctx.globalAlpha = 0.25 + l.depth * 0.5;
            ctx.beginPath();
            ctx.arc(l.x, l.y, l.size * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(140,200,140,0.8)";
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        return requestAnimationFrame(animate);
    };

    return animate;
}