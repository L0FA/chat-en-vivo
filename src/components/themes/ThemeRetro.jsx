// ============================================
// 🚗 TEMA RETRO - Estilo Synthwave 80s
// ============================================

export function createRetroAnimation(ctx, canvas) {
    let frame = 0;
    let roadOffset = 0;
    const horizon = canvas.height * 0.55;

    const stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * horizon,
        depth: Math.random(),
        alpha: Math.random()
    }));

    const buildings = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        w: 20 + Math.random() * 40,
        h: 40 + Math.random() * 120,
        depth: Math.random()
    }));

    const mountains = [
        { height: 140, speed: 0.2, color: "#ff0080" },
        { height: 100, speed: 0.35, color: "#ff4da6" },
        { height: 70, speed: 0.5, color: "#ff80bf" }
    ];

    const animate = () => {
        frame++;
        roadOffset += 2;

        ctx.fillStyle = "#0a0014";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        stars.forEach(s => {
            s.alpha += (Math.random() - 0.5) * 0.05;
            s.alpha = Math.max(0.3, Math.min(1, s.alpha));
            const speed = 0.1 + s.depth * 0.3;
            s.x -= speed;
            if (s.x < 0) { s.x = canvas.width; s.y = Math.random() * horizon; }
            ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
            ctx.fillRect(s.x, s.y, 2, 2);
        });

        const cx = canvas.width / 2;
        const cy = horizon - 60;

        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = `rgba(255,100,150,${1 - i * 0.15})`;
            ctx.fillRect(cx - 100 + i * 8, cy - 60 + i * 12, 200 - i * 16, 18);
        }

        mountains.forEach(layer => {
            ctx.fillStyle = layer.color;
            for (let x = -100; x < canvas.width + 100; x += 50) {
                const y = horizon + Math.sin((x + frame * layer.speed) * 0.01) * layer.height;
                ctx.beginPath();
                ctx.moveTo(x, horizon);
                ctx.lineTo(x + 25, y);
                ctx.lineTo(x + 50, horizon);
                ctx.closePath();
                ctx.fill();
            }
        });

        buildings.forEach(b => {
            const speed = 0.2 + b.depth * 0.5;
            b.x -= speed;
            if (b.x + b.w < 0) { b.x = canvas.width; b.h = 40 + Math.random() * 120; }
            ctx.fillStyle = `rgba(20,0,40,${0.8 + b.depth * 0.2})`;
            ctx.fillRect(b.x, horizon - b.h, b.w, b.h);
            for (let wy = 0; wy < b.h; wy += 8) {
                for (let wx = 0; wx < b.w; wx += 6) {
                    if (Math.random() < 0.1) {
                        ctx.fillStyle = "rgba(255,200,255,0.6)";
                        ctx.fillRect(b.x + wx, horizon - b.h + wy, 2, 2);
                    }
                }
            }
        });

        // Ruta
        ctx.fillStyle = "#050505";
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.2, canvas.height);
        ctx.lineTo(canvas.width * 0.8, canvas.height);
        ctx.lineTo(canvas.width * 0.55, horizon);
        ctx.lineTo(canvas.width * 0.45, horizon);
        ctx.closePath();
        ctx.fill();

        for (let i = 0; i < 30; i++) {
            const t = (i * 40 + roadOffset) % canvas.height;
            const scale = t / canvas.height;
            const x = canvas.width / 2;
            const y = horizon + t;
            const width = 4 + scale * 10;
            const height = 10 + scale * 20;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x - width / 2, y, width, height);
        }

        const carX = canvas.width / 2;
        const carY = canvas.height - 60;
        ctx.fillStyle = "#ff0080";
        ctx.fillRect(carX - 20, carY, 40, 10);
        ctx.fillStyle = "#ff4da6";
        ctx.fillRect(carX - 15, carY - 10, 30, 10);
        ctx.fillStyle = "#000";
        ctx.fillRect(carX - 18, carY + 8, 8, 6);
        ctx.fillRect(carX + 10, carY + 8, 8, 6);
        ctx.fillStyle = "rgba(255,255,200,0.8)";
        ctx.fillRect(carX - 12, carY - 2, 4, 2);
        ctx.fillRect(carX + 8, carY - 2, 4, 2);

        // Scanlines
        for (let y = 0; y < canvas.height; y += 4) {
            ctx.fillStyle = "rgba(0,0,0,0.06)";
            ctx.fillRect(0, y, canvas.width, 2);
        }

        ctx.fillStyle = "rgba(255,0,120,0.03)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return requestAnimationFrame(animate);
    };

    return animate;
}