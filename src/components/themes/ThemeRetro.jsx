// ============================================
// 🚗 TEMA RETRO - Outrun Synthwave 80s
// ============================================

export function createRetroAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let frame = 0;
    let roadOffset = 0;
    const horizon = canvas.height * 0.52;

    const stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * horizon,
        depth: Math.random(),
        alpha: Math.random()
    }));

    const buildings = Array.from({ length: 35 }, () => ({
        x: Math.random() * canvas.width,
        w: 18 + Math.random() * 45,
        h: 35 + Math.random() * 130,
        depth: Math.random()
    }));

    const mountains = [
        { height: 130, speed: 0.18, color: "#ff0080" },
        { height: 95, speed: 0.32, color: "#ff4da6" },
        { height: 65, speed: 0.48, color: "#ff80bf" }
    ];

    const animate = () => {
        if (stopped) return;
        frame++;
        roadOffset += 1.8;

        ctx.fillStyle = "#080010";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        stars.forEach(s => {
            s.alpha += (Math.random() - 0.5) * 0.04;
            s.alpha = Math.max(0.25, Math.min(1, s.alpha));
            const speed = 0.08 + s.depth * 0.28;
            s.x -= speed;
            if (s.x < 0) { s.x = canvas.width; s.y = Math.random() * horizon; }
            ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
            ctx.fillRect(s.x, s.y, 1.8, 1.8);
        });

        const cx = canvas.width / 2;
        const cy = horizon - 55;

        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = `rgba(255,95,145,${1 - i * 0.14})`;
            ctx.fillRect(cx - 95 + i * 7, cy - 55 + i * 11, 190 - i * 15, 16);
        }

        mountains.forEach(layer => {
            ctx.fillStyle = layer.color;
            for (let x = -90; x < canvas.width + 90; x += 45) {
                const y = horizon + Math.sin((x + frame * layer.speed) * 0.008) * layer.height;
                ctx.beginPath();
                ctx.moveTo(x, horizon);
                ctx.lineTo(x + 22, y);
                ctx.lineTo(x + 45, horizon);
                ctx.closePath();
                ctx.fill();
            }
        });

        buildings.forEach(b => {
            const speed = 0.18 + b.depth * 0.45;
            b.x -= speed;
            if (b.x + b.w < 0) { b.x = canvas.width; b.h = 35 + Math.random() * 130; }
            ctx.fillStyle = `rgba(15,0,30,${0.75 + b.depth * 0.25})`;
            ctx.fillRect(b.x, horizon - b.h, b.w, b.h);
            for (let wy = 0; wy < b.h; wy += 7) {
                for (let wx = 0; wx < b.w; wx += 5) {
                    if (Math.random() < 0.09) {
                        ctx.fillStyle = "rgba(255,190,255,0.55)";
                        ctx.fillRect(b.x + wx, horizon - b.h + wy, 1.8, 1.8);
                    }
                }
            }
        });

        ctx.fillStyle = "#030303";
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.18, canvas.height);
        ctx.lineTo(canvas.width * 0.82, canvas.height);
        ctx.lineTo(canvas.width * 0.53, horizon);
        ctx.lineTo(canvas.width * 0.47, horizon);
        ctx.closePath();
        ctx.fill();

        for (let i = 0; i < 35; i++) {
            const t = (i * 35 + roadOffset) % canvas.height;
            const scale = t / canvas.height;
            const x = canvas.width / 2;
            const y = horizon + t;
            const width = 3 + scale * 9;
            const height = 9 + scale * 18;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x - width / 2, y, width, height);
        }

        const carX = canvas.width / 2;
        const carY = canvas.height - 55;
        ctx.fillStyle = "#ff0080";
        ctx.fillRect(carX - 18, carY, 36, 9);
        ctx.fillStyle = "#ff4da6";
        ctx.fillRect(carX - 14, carY - 9, 28, 9);
        ctx.fillStyle = "#000";
        ctx.fillRect(carX - 16, carY + 7, 7, 5);
        ctx.fillRect(carX + 9, carY + 7, 7, 5);
        ctx.fillStyle = "rgba(255,255,190,0.75)";
        ctx.fillRect(carX - 11, carY - 1.8, 3.5, 1.8);
        ctx.fillRect(carX + 7.5, carY - 1.8, 3.5, 1.8);

        for (let y = 0; y < canvas.height; y += 3.5) {
            ctx.fillStyle = "rgba(0,0,0,0.05)";
            ctx.fillRect(0, y, canvas.width, 1.8);
        }

        ctx.fillStyle = "rgba(255,0,115,0.025)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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