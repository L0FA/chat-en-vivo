// ============================================
// 🌅 TEMA RETRO - Outrun Synthwave 80s (Fondo Puro)
// ============================================

export function createRetroAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;
    const horizon = canvas.height * 0.55;

    // Estrellas estáticas con brillo suave
    const stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * horizon * 0.8,
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.5 + Math.random() * 0.5
    }));

    // Montañas fijas con gradiente
    const mountainLayers = [
        { peaks: [], height: 150, color: ["#7c1a5f", "#a32d7a", "#d44a9f"] },
        { peaks: [], height: 100, color: ["#5a1245", "#8a1f60", "#c43885"] },
        { peaks: [], height: 60, color: ["#3d0d2f", "#5f1545", "#9a2565"] }
    ];

    mountainLayers.forEach(layer => {
        for (let x = 0; x <= canvas.width + 100; x += 30) {
            layer.peaks.push({
                x,
                h: layer.height * (0.7 + Math.random() * 0.5),
                offset: Math.random() * 100
            });
        }
    });

    // Grilla en movimiento
    let gridOffset = 0;

    const animate = () => {
        if (stopped) return;
        time += 0.016;
        gridOffset = (gridOffset + 2) % 50;

        // Cielo degradido púrpura profundo
        const skyGradient = ctx.createLinearGradient(0, 0, 0, horizon);
        skyGradient.addColorStop(0, "#1a0520");
        skyGradient.addColorStop(0.4, "#2d0a35");
        skyGradient.addColorStop(0.7, "#4a0f45");
        skyGradient.addColorStop(1, "#6b1555");
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Estrellas brillantes
        stars.forEach(s => {
            const twinkle = 0.7 + Math.sin(time * 2 + s.x) * 0.3;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * twinkle, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * twinkle})`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Sol Outrun grande y brillante
        const sunX = canvas.width / 2;
        const sunY = horizon - 30;
        const sunRadius = Math.min(canvas.width, canvas.height) * 0.18;

        // Brillo exterior del sol
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
        sunGlow.addColorStop(0, "rgba(255, 100, 150, 0.4)");
        sunGlow.addColorStop(0.5, "rgba(255, 50, 100, 0.2)");
        sunGlow.addColorStop(1, "transparent");
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cuerpo del sol con degradido
        const sunGradient = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
        sunGradient.addColorStop(0, "#fff5a0");
        sunGradient.addColorStop(0.3, "#ffcc00");
        sunGradient.addColorStop(0.6, "#ff8800");
        sunGradient.addColorStop(1, "#ff4466");

        ctx.save();
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 30;
        ctx.shadowColor = "rgba(255, 100, 50, 0.6)";
        ctx.fill();

        // Líneas de escaneo en el sol (sombra)
        ctx.globalCompositeOperation = "destination-out";
        for (let i = 0; i < 10; i++) {
            const lineY = sunY + (i * 12) - 20 + Math.sin(time + i) * 2;
            const lineHeight = 2 + i * 0.5;
            if (lineY > sunY - 10 && lineY < sunY + sunRadius) {
                ctx.fillRect(sunX - sunRadius, lineY, sunRadius * 2, lineHeight);
            }
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();

        // Montañas por capas (sin animación de movimiento)
        mountainLayers.forEach((layer, layerIndex) => {
            const gradient = ctx.createLinearGradient(0, horizon - layer.height, 0, horizon);
            gradient.addColorStop(0, layer.color[0]);
            gradient.addColorStop(0.5, layer.color[1]);
            gradient.addColorStop(1, layer.color[2]);
            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.moveTo(0, horizon);
            layer.peaks.forEach((peak, i) => {
                const x = peak.x - (layerIndex * 30);
                const y = horizon - peak.h + Math.sin(i + layerIndex) * 10;
                ctx.lineTo(x, y);
                ctx.lineTo(x + 15, horizon - peak.h * 0.5 + Math.sin(i + 0.5 + layerIndex) * 8);
            });
            ctx.lineTo(canvas.width + 100, horizon);
            ctx.closePath();
            ctx.fill();
        });

        // Suelo degradido
        const groundGradient = ctx.createLinearGradient(0, horizon, 0, canvas.height);
        groundGradient.addColorStop(0, "#1a0520");
        groundGradient.addColorStop(0.3, "#2a0835");
        groundGradient.addColorStop(1, "#4a0f55");
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);

        // Grilla en perspectiva
        ctx.save();
        ctx.strokeStyle = "rgba(255, 100, 200, 0.5)";
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(255, 100, 200, 0.8)";

        // Líneas horizontales (movimiento)
        for (let i = 0; i < 20; i++) {
            const y = horizon + Math.pow(i / 20, 2.5) * (canvas.height - horizon);
            const adjustedY = y + gridOffset;
            if (adjustedY > horizon && adjustedY < canvas.height) {
                ctx.beginPath();
                ctx.moveTo(0, adjustedY);
                ctx.lineTo(canvas.width, adjustedY);
                ctx.stroke();
            }
        }

        // Líneas verticales (perspectiva)
        const vLines = 25;
        for (let i = 0; i <= vLines; i++) {
            const x = (i / vLines) * canvas.width;
            ctx.beginPath();
            ctx.moveTo(x, canvas.height);
            ctx.lineTo(canvas.width / 2 + (x - canvas.width / 2) * 0.1, horizon);
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