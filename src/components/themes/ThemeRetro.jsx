// ============================================
// 🕹️ TEMA RETRO - Outrun con Auto
// ============================================

export function createRetroAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let gridOffset = 0;
    let carBob = 0;
    const horizon = canvas.height * 0.5;
    const cx = canvas.width / 2;
    const pxSize = 4;

    const stars = Array.from({ length: 60 }, () => ({
        x: Math.floor(Math.random() * canvas.width / pxSize) * pxSize,
        y: Math.floor(Math.random() * horizon * 0.6 / pxSize) * pxSize,
        size: pxSize,
        blink: Math.random() * Math.PI * 2
    }));

    const mountains = [];
    for (let layer = 0; layer < 3; layer++) {
        const peaks = [];
        for (let x = 0; x <= canvas.width + pxSize * 4; x += pxSize * 4) {
            peaks.push({ x, h: (60 + layer * 40) * (0.4 + Math.random() * 0.6) });
        }
        mountains.push({ peaks, layer });
    }

    const drawCar = (time) => {
        const carX = cx;
        const carY = canvas.height - 60 + Math.sin(time * 2) * 2; // Leve rebote
        const carW = 50;
        const carH = 20;

        // Sombra
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(carX - carW / 2 - 2, carY + carH + 2, carW + 4, 6);

        // Cuerpo
        ctx.fillStyle = "#ff2060";
        ctx.fillRect(carX - carW / 2, carY, carW, carH);
        // Techo
        ctx.fillStyle = "#cc1850";
        ctx.fillRect(carX - carW / 4, carY - carH * 0.6, carW / 2, carH * 0.6);
        // Ventana
        ctx.fillStyle = "#40d0ff";
        ctx.fillRect(carX - carW / 4 + 3, carY - carH * 0.5, carW / 2 - 6, carH * 0.45);
        // Ruedas
        ctx.fillStyle = "#222";
        ctx.fillRect(carX - carW / 2 + 4, carY + carH, 10, 6);
        ctx.fillRect(carX + carW / 2 - 14, carY + carH, 10, 6);
        // Luces traseras
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(carX - carW / 2, carY + 4, 4, 6);
        ctx.fillRect(carX + carW / 2 - 4, carY + 4, 4, 6);
        // Destello delantero (faros reflejados)
        ctx.fillStyle = `rgba(255, 255, 200, ${0.3 + Math.sin(time * 5) * 0.1})`;
        ctx.fillRect(carX - carW / 2 - 8, carY + carH - 2, 6, 4);
        ctx.fillRect(carX + carW / 2 + 2, carY + carH - 2, 6, 4);
    };

    const animate = () => {
        if (stopped) return;
        gridOffset = (gridOffset + 1.2) % (pxSize * 8);
        carBob += 0.03;

        // Cielo
        const sky = ctx.createLinearGradient(0, 0, 0, horizon);
        sky.addColorStop(0, "#080010");
        sky.addColorStop(0.4, "#1a0030");
        sky.addColorStop(0.8, "#400060");
        sky.addColorStop(1, "#600090");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Estrellas
        stars.forEach(s => {
            s.blink += 0.03;
            if (Math.sin(s.blink) > 0) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(s.x, s.y, pxSize, pxSize);
            }
        });

        // Sol pixelado
        const sunY = horizon - 60;
        const sunR = 50;
        for (let py = -sunR; py <= sunR; py += pxSize) {
            for (let px = -sunR; px <= sunR; px += pxSize) {
                if (px * px + py * py <= sunR * sunR) {
                    const dist = Math.sqrt(px * px + py * py) / sunR;
                    if (dist < 0.5) ctx.fillStyle = "#ffffaa";
                    else if (dist < 0.75) ctx.fillStyle = "#ffaa00";
                    else ctx.fillStyle = "#ff5500";
                    ctx.fillRect(cx + px, sunY + py, pxSize, pxSize);
                }
            }
        }

        // Montañas
        const mColors = ["#6a2080", "#4a1060", "#2a0840"];
        mountains.forEach((m, idx) => {
            ctx.fillStyle = mColors[idx];
            m.peaks.forEach((p, i) => {
                if (i === 0) return;
                const prev = m.peaks[i - 1];
                const steps = Math.ceil((p.x - prev.x) / pxSize);
                for (let s = 0; s < steps; s++) {
                    const t = s / steps;
                    const h = prev.h + (p.h - prev.h) * t;
                    const x = prev.x + s * pxSize;
                    for (let y = horizon - h; y < horizon; y += pxSize) {
                        ctx.fillRect(Math.floor(x / pxSize) * pxSize, Math.floor(y / pxSize) * pxSize, pxSize, pxSize);
                    }
                }
            });
        });

        // Suelo
        ctx.fillStyle = "#0a0015";
        ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);

        // Grid - Horizontales fluidas (interpolación sub-pixel)
        ctx.strokeStyle = "rgba(255, 60, 180, 0.6)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 18; i++) {
            const spacing = 6 + i * 4.5;
            const y = horizon + 8 + i * spacing + gridOffset * (1 + i * 0.12);
            const wrapped = ((y - horizon) % (canvas.height - horizon)) + horizon;
            if (wrapped > horizon && wrapped < canvas.height) {
                const alpha = (1 - i / 18) * 0.7;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.moveTo(0, wrapped);
                ctx.lineTo(canvas.width, wrapped);
                ctx.stroke();
            }
        }

        // Grid - Verticales fluidas
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.5;
        for (let i = -14; i <= 14; i++) {
            const topX = cx + i * 12;
            const bottomX = cx + i * (canvas.width / 14);
            ctx.beginPath();
            ctx.moveTo(topX, horizon + 8);
            ctx.lineTo(bottomX, canvas.height);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Auto
        drawCar(carBob);

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