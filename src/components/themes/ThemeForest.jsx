// ============================================
// 🌲 TEMA FOREST - Bosque Vivo con Luciérnagas
// ============================================

export function createForestAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    // Canvas estático para árboles
    const treeCanvas = document.createElement("canvas");
    treeCanvas.width = canvas.width;
    treeCanvas.height = canvas.height;
    const tCtx = treeCanvas.getContext("2d");

    const trees = [];
    for (let i = 0; i < 40; i++) {
        trees.push({
            x: Math.random() * canvas.width,
            depth: 0.15 + Math.random() * 0.85,
            size: 80 + Math.random() * 120
        });
    }

    const drawTreeStatic = (x, y, angle, length, width, depth, branchLevel) => {
        if (length < 8) return;

        tCtx.beginPath();
        tCtx.moveTo(x, y);
        const nextX = x + Math.cos(angle) * length;
        const nextY = y + Math.sin(angle) * length;
        tCtx.lineTo(nextX, nextY);
        
        const green = 20 + Math.floor(depth * 40);
        tCtx.lineWidth = width;
        tCtx.strokeStyle = `rgba(${10 + branchLevel * 5}, ${green}, ${10}, ${depth * 0.9})`;
        tCtx.lineCap = "round";
        tCtx.stroke();

        // Hojas en las puntas
        if (length < 25 && branchLevel > 2) {
            const leafColors = [
                `rgba(30, ${80 + Math.random() * 60}, 20, ${depth * 0.7})`,
                `rgba(50, ${100 + Math.random() * 50}, 30, ${depth * 0.6})`,
                `rgba(20, ${70 + Math.random() * 40}, 15, ${depth * 0.5})`
            ];
            tCtx.fillStyle = leafColors[Math.floor(Math.random() * 3)];
            tCtx.beginPath();
            tCtx.arc(nextX, nextY, 4 + Math.random() * 8, 0, Math.PI * 2);
            tCtx.fill();
        }

        drawTreeStatic(nextX, nextY, angle - 0.3 - Math.random() * 0.2, length * 0.72, width * 0.6, depth, branchLevel + 1);
        drawTreeStatic(nextX, nextY, angle + 0.3 + Math.random() * 0.2, length * 0.72, width * 0.6, depth, branchLevel + 1);
    };

    // Pre-dibujar
    trees.sort((a, b) => a.depth - b.depth).forEach(t => {
        drawTreeStatic(t.x, canvas.height, -Math.PI / 2, t.size * t.depth, 12 * t.depth, t.depth, 0);
        tCtx.fillStyle = `rgba(80, 100, 80, 0.015)`;
        tCtx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // Hojas que caen
    const leaves = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height,
        size: 2 + Math.random() * 4,
        speedY: 0.3 + Math.random() * 0.7,
        speedX: (Math.random() - 0.5) * 0.8,
        wobble: Math.random() * Math.PI * 2,
        hue: 80 + Math.random() * 60, // Verde a amarillo
        sat: 40 + Math.random() * 40
    }));

    // Luciérnagas
    const fireflies = Array.from({ length: 25 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.3 + Math.random() * canvas.height * 0.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.3
    }));

    const animate = () => {
        if (stopped) return;
        time += 0.015;

        // Fondo
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, "#020a02");
        bg.addColorStop(0.4, "#051005");
        bg.addColorStop(1, "#030803");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Árboles estáticos
        ctx.drawImage(treeCanvas, 0, 0);

        // Hojas cayendo
        leaves.forEach(l => {
            l.y += l.speedY;
            l.x += l.speedX + Math.sin(time * 2 + l.wobble) * 0.8;
            if (l.y > canvas.height + 10) { l.y = -10; l.x = Math.random() * canvas.width; }

            ctx.fillStyle = `hsla(${l.hue}, ${l.sat}%, 35%, 0.6)`;
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(Math.sin(time + l.wobble) * 0.5);
            ctx.beginPath();
            ctx.ellipse(0, 0, l.size, l.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Luciérnagas (brillo pulsante)
        fireflies.forEach(f => {
            f.x += f.dx + Math.sin(time + f.phase) * 0.3;
            f.y += f.dy + Math.cos(time * 0.7 + f.phase) * 0.2;
            if (f.x < 0 || f.x > canvas.width) f.dx *= -1;
            if (f.y < canvas.height * 0.2 || f.y > canvas.height) f.dy *= -1;

            const glow = 0.3 + Math.sin(time * 3 + f.phase) * 0.7;
            if (glow > 0) {
                const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 12);
                grad.addColorStop(0, `rgba(200, 255, 100, ${glow * 0.8})`);
                grad.addColorStop(1, `rgba(100, 200, 50, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(f.x, f.y, 12, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(255, 255, 200, ${glow})`;
                ctx.beginPath();
                ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Neblina sutil
        ctx.fillStyle = `rgba(60, 80, 60, ${0.03 + Math.sin(time * 0.5) * 0.01})`;
        ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);

        // Efecto de ventisca (rayas horizontales de viento)
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = "rgba(180, 200, 180, 1)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
            const baseY = (canvas.height * 0.3) + (i * canvas.height * 0.06);
            const offsetX = (time * 80 + i * 200) % (canvas.width + 300) - 150;
            const len = 60 + Math.sin(time + i) * 30;
            ctx.beginPath();
            ctx.moveTo(offsetX, baseY + Math.sin(time * 2 + i) * 8);
            ctx.lineTo(offsetX + len, baseY + Math.sin(time * 2 + i + 1) * 5);
            ctx.stroke();
        }
        ctx.restore();

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