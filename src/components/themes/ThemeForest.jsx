// ============================================
// 🌲 TEMA FOREST - Bosques procedurales con luciérnagas
// ============================================

export function createForestAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let wind = 0;
    let time = 0;

    const forestLayers = [
        { depth: 0.2, count: 10, color: "rgba(8,18,8,0.12)" },
        { depth: 0.5, count: 14, color: "rgba(15,35,15,0.2)" },
        { depth: 1, count: 18, color: "rgba(25,55,25,0.3)" }
    ];

    const trees = forestLayers.flatMap(layer =>
        Array.from({ length: layer.count }, () => ({
            x: Math.random() * canvas.width,
            depth: layer.depth,
            height: canvas.height * (0.3 + Math.random() * 0.55),
            swayOffset: Math.random() * Math.PI,
            layer
        }))
    );

    const fireflies = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        pulse: Math.random() * Math.PI * 2
    }));

    const leaves = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 5 + Math.random() * 10,
        speed: 0.15 + Math.random() * 0.9,
        wobble: Math.random() * Math.PI * 2,
        depth: Math.random()
    }));

    const drawTree = (t, sway) => {
        const x = t.x + sway;
        const baseY = canvas.height;
        const trunkWidth = 4 + t.depth * 12;
        const trunkHeight = t.height;
        const baseX = x + trunkWidth / 2;

        ctx.fillStyle = `rgba(12,22,12,${0.15 + t.depth * 0.5})`;
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

            const shade = 22 + t.depth * 42 - i * 6;
            ctx.fillStyle = `rgba(18, ${shade}, 18, ${0.15 + t.depth * 0.45})`;
            ctx.fill();
        }
    };

    const animate = () => {
        if (stopped) return;
        wind += 0.005 + Math.sin(time * 0.25) * 0.002;
        time += 0.008;

        ctx.fillStyle = "rgba(4,10,4,0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        forestLayers.forEach((layer, i) => {
            const fogY = canvas.height * (0.45 + i * 0.18);
            const fog = ctx.createLinearGradient(0, fogY, 0, canvas.height);
            fog.addColorStop(0, "rgba(180,255,180,0)");
            fog.addColorStop(1, layer.color);
            ctx.fillStyle = fog;
            ctx.fillRect(0, fogY, canvas.width, canvas.height);
        });

        const topFog = ctx.createLinearGradient(0, 0, 0, canvas.height);
        topFog.addColorStop(0, "rgba(180,255,180,0.015)");
        topFog.addColorStop(0.5, "rgba(0,0,0,0)");
        topFog.addColorStop(1, "rgba(0,0,0,0.2)");
        ctx.fillStyle = topFog;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        trees.forEach(t => {
            const windFactor = Math.sin(wind + t.swayOffset) * (2.5 + t.depth * 7);
            drawTree(t, windFactor);
        });

        fireflies.forEach(f => {
            f.x += f.vx + Math.sin(time + f.y * 0.008) * 0.12;
            f.y += f.vy;
            f.pulse += 0.04;
            const glow = (Math.sin(f.pulse) + 1) / 2;

            if (f.x < 0) f.x = canvas.width;
            if (f.x > canvas.width) f.x = 0;
            if (f.y < 0) f.y = canvas.height;
            if (f.y > canvas.height) f.y = 0;

            ctx.beginPath();
            ctx.arc(f.x, f.y, 1.2 + glow * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(160,255,100,${0.2 + glow * 0.65})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(160,255,100,0.6)";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        leaves.forEach(l => {
            l.y += l.speed * (0.35 + l.depth);
            l.wobble += 0.012;
            l.x += Math.sin(l.wobble + wind) * (0.6 + l.depth * 1.8);

            if (l.y > canvas.height) {
                l.y = -18;
                l.x = Math.random() * canvas.width;
            }

            ctx.globalAlpha = 0.2 + l.depth * 0.5;
            ctx.beginPath();
            ctx.arc(l.x, l.y, l.size * 0.22, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(130,190,130,0.75)";
            ctx.fill();
        });

        ctx.globalAlpha = 1;
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