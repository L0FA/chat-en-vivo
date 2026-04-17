// ============================================
// 🌲 TEMA FOREST - Bosque nocturno profundo (Sin opacidad blanca)
// ============================================

export function createForestAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let wind = 0;
    let time = 0;

    // Capas de árboles con siluetas oscuras
    const forestLayers = [
        { depth: 0.3, count: 8, color: ["#0a1a0a", "#1a2a1a", "#2a3a2a"] },
        { depth: 0.6, count: 12, color: ["#051005", "#0f1f0f", "#1a2a1a"] },
        { depth: 1, count: 16, color: ["#020802", "#081208", "#101810"] }
    ];

    const trees = forestLayers.flatMap(layer =>
        Array.from({ length: layer.count }, () => ({
            x: Math.random() * canvas.width,
            depth: layer.depth,
            height: canvas.height * (0.35 + Math.random() * 0.5),
            swayOffset: Math.random() * Math.PI,
            colors: layer.color
        }))
    );

    // Luciérnagas brillantes
    const fireflies = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        pulse: Math.random() * Math.PI * 2,
        size: 1 + Math.random() * 2
    }));

    const drawTree = (t, sway) => {
        const x = t.x + sway;
        const baseY = canvas.height;
        const trunkWidth = 3 + t.depth * 10;
        const trunkHeight = t.height;
        const baseX = x + trunkWidth / 2;

        // Tronco oscuro
        ctx.fillStyle = t.colors[0];
        ctx.fillRect(x, baseY - trunkHeight, trunkWidth, trunkHeight);

        // Capas del árbol (triángulos)
        const layers = 3 + Math.floor(t.depth * 2);
        for (let i = 0; i < layers; i++) {
            const width = (50 + t.depth * 80) * (1 - i * 0.25);
            const height = 18 + t.depth * 10;
            const yOffset = i * (height * 0.55);

            ctx.beginPath();
            ctx.moveTo(baseX, baseY - trunkHeight - yOffset - height);
            ctx.lineTo(baseX - width / 2, baseY - trunkHeight - yOffset);
            ctx.lineTo(baseX + width / 2, baseY - trunkHeight - yOffset);
            ctx.closePath();

            ctx.fillStyle = t.colors[i % t.colors.length];
            ctx.fill();
        }
    };

    const animate = () => {
        if (stopped) return;
        wind += 0.004 + Math.sin(time * 0.2) * 0.0015;
        time += 0.006;

        // Fondo degradido oscuro - sin opacidad blanca
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, "#0a1410");
        bgGradient.addColorStop(0.4, "#051008");
        bgGradient.addColorStop(1, "#020804");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Niebla por capas (oscura, no blanca)
        forestLayers.forEach((layer, i) => {
            const fogY = canvas.height * (0.5 + i * 0.15);
            const fog = ctx.createLinearGradient(0, fogY, 0, canvas.height);
            fog.addColorStop(0, "transparent");
            fog.addColorStop(1, `rgba(5, 15, 8, ${0.15 + i * 0.1})`);
            ctx.fillStyle = fog;
            ctx.fillRect(0, fogY, canvas.width, canvas.height);
        });

        // Árboles por capas de profundidad
        trees.forEach(t => {
            const windFactor = Math.sin(wind + t.swayOffset) * (2 + t.depth * 5);
            drawTree(t, windFactor);
        });

        // Luciérnagas
        fireflies.forEach(f => {
            f.x += f.vx + Math.sin(time * 0.5 + f.y * 0.01) * 0.08;
            f.y += f.vy + Math.sin(time * 0.3 + f.x * 0.01) * 0.05;
            f.pulse += 0.035;
            const glow = (Math.sin(f.pulse) + 1) / 2;

            // Wrap around
            if (f.x < 0) f.x = canvas.width;
            if (f.x > canvas.width) f.x = 0;
            if (f.y < 0) f.y = canvas.height * 0.7;
            if (f.y > canvas.height * 0.7) f.y = 0;

            // Glow exterior
            const outerGlow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 4);
            outerGlow.addColorStop(0, `rgba(120, 255, 80, ${0.15 + glow * 0.3})`);
            outerGlow.addColorStop(1, "transparent");
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size * 4, 0, Math.PI * 2);
            ctx.fill();

            // Núcleo brillante
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size * (0.8 + glow * 0.4), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 255, 120, ${0.5 + glow * 0.5})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(150, 255, 100, 0.8)";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Hojas cayendo (sutiles)
        for (let i = 0; i < 15; i++) {
            const leafX = (Math.sin(time * 0.2 + i) * 0.3 + 0.5) * canvas.width;
            const leafY = ((time * 0.15 + i * 0.3) % 1) * canvas.height;
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = "#1a3a1a";
            ctx.beginPath();
            ctx.arc(leafX, leafY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
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