// ============================================
// 🌅 TEMA RETRO - Outrun Synthwave 80s Clásico
// ============================================

export function createRetroAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;
    const horizon = canvas.height * 0.5;

    const stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * horizon * 0.8,
        size: 0.6 + Math.random() * 1.4,
        twinkle: Math.random() * Math.PI * 2
    }));

    const mountainLayers = [
        { peaks: [], height: 180, color: ["#6b1a5c", "#8a2d7a", "#a83d96"] },
        { peaks: [], height: 120, color: ["#4a1245", "#6a1f60", "#8a2d7a"] },
        { peaks: [], height: 70, color: ["#2d0a2a", "#4a1245", "#6a1a5c"] }
    ];

    mountainLayers.forEach(layer => {
        for (let x = -50; x <= canvas.width + 50; x += 25) {
            layer.peaks.push({
                x,
                h: layer.height * (0.6 + Math.random() * 0.5)
            });
        }
    });

    let gridOffset = 0;

    const animate = () => {
        if (stopped) return;
        
        time += 0.02;
        gridOffset = (gridOffset + 1.5) % 30;

        // Cielo - gradiente sólido sin opacidad
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
        skyGrad.addColorStop(0, "#0d0018");
        skyGrad.addColorStop(0.3, "#1a0a2e");
        skyGrad.addColorStop(0.6, "#3d1250");
        skyGrad.addColorStop(1, "#6b1a6b");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Estrellas
        stars.forEach(s => {
            s.twinkle += 0.03;
            const alpha = 0.6 + Math.sin(s.twinkle) * 0.4;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        });

        // Sol Outrun
        const sunX = canvas.width / 2;
        const sunY = horizon - 40;
        const sunRadius = Math.min(canvas.width, canvas.height) * 0.2;

        // Brillo exterior del sol
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3);
        sunGlow.addColorStop(0, "rgba(255, 180, 100, 0.5)");
        sunGlow.addColorStop(0.3, "rgba(255, 100, 150, 0.3)");
        sunGlow.addColorStop(0.7, "rgba(255, 50, 100, 0.1)");
        sunGlow.addColorStop(1, "transparent");
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, canvas.width, horizon + 100);

        // Cuerpo del sol
        const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
        sunGrad.addColorStop(0, "#ffffaa");
        sunGrad.addColorStop(0.2, "#ffdd00");
        sunGrad.addColorStop(0.5, "#ff8800");
        sunGrad.addColorStop(1, "#ff3366");

        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fillStyle = sunGrad;
        ctx.fill();

        // Líneas de escaneo en el sol
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        for (let i = 0; i < 8; i++) {
            const lineY = sunY + (i * 14) - 15 + Math.sin(time + i * 0.5) * 3;
            const lineH = 2 + i * 0.4;
            if (lineY > sunY - sunRadius * 0.5 && lineY < sunY + sunRadius * 0.8) {
                ctx.fillRect(sunX - sunRadius, lineY, sunRadius * 2, lineH);
            }
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();

        // Montañas
        mountainLayers.forEach((layer, idx) => {
            const mtnGrad = ctx.createLinearGradient(0, horizon - layer.height, 0, horizon);
            mtnGrad.addColorStop(0, layer.color[0]);
            mtnGrad.addColorStop(0.5, layer.color[1]);
            mtnGrad.addColorStop(1, layer.color[2]);

            ctx.fillStyle = mtnGrad;
            ctx.beginPath();
            ctx.moveTo(-50, horizon);
            
            layer.peaks.forEach((peak, i) => {
                const xOffset = idx * 25;
                const wave = Math.sin(i * 0.3 + time * 0.5) * 8;
                ctx.lineTo(peak.x + xOffset, horizon - peak.h + wave);
            });
            
            ctx.lineTo(canvas.width + 50, horizon);
            ctx.closePath();
            ctx.fill();
        });

        // Suelo - gradiente sólido
        const groundGrad = ctx.createLinearGradient(0, horizon, 0, canvas.height);
        groundGrad.addColorStop(0, "#0d0018");
        groundGrad.addColorStop(0.5, "#1a0525");
        groundGrad.addColorStop(1, "#2a0a35");
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);

        // Grid - líneas más fluidas y vibrantes
        ctx.save();
        ctx.strokeStyle = "rgba(255, 80, 180, 0.7)";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "rgba(255, 100, 220, 0.9)";
        ctx.shadowBlur = 12;

        // Horizontales - movimiento fluido
        for (let i = 0; i < 25; i++) {
            const y = horizon + Math.pow((i + gridOffset / 30) / 25, 2.8) * (canvas.height - horizon);
            
            if (y > horizon + 5) {
                ctx.globalAlpha = 0.3 + (1 - i / 25) * 0.5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }

        // Verticales - perspectiva hacia el horizonte
        ctx.globalAlpha = 0.6;
        const centerX = canvas.width / 2;
        
        for (let i = -15; i <= 15; i++) {
            const x = centerX + i * (canvas.width / 16);
            const vanishX = centerX + i * 15;
            
            ctx.beginPath();
            ctx.moveTo(x, canvas.height);
            ctx.lineTo(vanishX, horizon + 20);
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