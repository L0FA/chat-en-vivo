// ============================================
// 🌲 TEMA FOREST - Bosque profundo SIN opacidad
// ============================================

export function createForestAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let wind = 0;
    let time = 0;

    const trees = Array.from({ length: 20 }, () => ({
        x: Math.random() * canvas.width,
        height: canvas.height * (0.4 + Math.random() * 0.45),
        width: 40 + Math.random() * 60,
        sway: Math.random() * Math.PI,
        layer: Math.floor(Math.random() * 3)
    }));

    const fireflies = Array.from({ length: 15 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.65,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.1,
        pulse: Math.random() * Math.PI * 2,
        size: 1 + Math.random() * 1.5
    }));

    const drawTree = (t) => {
        const sway = Math.sin(wind + t.sway) * (3 + t.layer * 2);
        const x = t.x + sway;
        const baseY = canvas.height;
        
        const layerColors = [
            ["#001000", "#001a05", "#002008"],
            ["#000800", "#001000", "#001805"],
            ["#000500", "#000a00", "#001200"]
        ];
        const colors = layerColors[t.layer];

        // Tronco
        ctx.fillStyle = colors[0];
        ctx.fillRect(x, baseY - t.height * 0.15, t.width * 0.1, t.height * 0.15);

        // Capas de hojas
        const layers = 4;
        for (let i = 0; i < layers; i++) {
            const y = baseY - t.height * (0.15 + i * 0.22);
            const w = t.width * (1 - i * 0.22);
            
            ctx.fillStyle = colors[Math.min(i, 2)];
            ctx.beginPath();
            ctx.moveTo(x + t.width * 0.05, y);
            ctx.lineTo(x - w/2, y + t.height * 0.18);
            ctx.lineTo(x + t.width * 1.05, y + t.height * 0.18);
            ctx.closePath();
            ctx.fill();
        }
    };

    const animate = () => {
        if (stopped) return;
        wind += 0.003;
        time += 0.005;

        // FONDO - Negro total SIN opacidad
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Capa oscura sólida
        ctx.fillStyle = "#000602";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Árboles
        trees.forEach(t => drawTree(t));

        // Luciérnagas - sin glow, puntos sólidos
        fireflies.forEach(f => {
            f.x += f.vx + Math.sin(time * 0.4 + f.y * 0.008) * 0.05;
            f.y += f.vy + Math.sin(time * 0.25 + f.x * 0.008) * 0.03;
            f.pulse += 0.03;
            const bright = Math.sin(f.pulse) > 0.3;

            if (f.x < 0) f.x = canvas.width;
            if (f.x > canvas.width) f.x = 0;
            if (f.y < 0) f.y = canvas.height * 0.65;
            if (f.y > canvas.height * 0.65) f.y = 0;

            // Punto sólido de luz
            ctx.fillStyle = bright ? "#88ff55" : "#44aa33";
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
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