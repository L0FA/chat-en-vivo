// ============================================
// 🌅 TEMA VAPORWAVE - Synthwave mejorado
// ============================================

export function createVaporwaveAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let gridOffset = 0;
    let time = 0;

    const cx = canvas.width / 2;
    const horizon = canvas.height * 0.42;

    const stars = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * horizon,
        size: 0.5 + Math.random() * 1.5,
        twinkle: Math.random() * Math.PI * 2
    }));

    const animate = () => {
        if (stopped) return;
        
        time += 0.02;
        gridOffset = (gridOffset + 1.5) % 40;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon + 50);
        skyGrad.addColorStop(0, "#1a0530");
        skyGrad.addColorStop(0.5, "#3d1045");
        skyGrad.addColorStop(1, "#6b2080");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, horizon + 50);

        stars.forEach(s => {
            s.twinkle += 0.05;
            const alpha = 0.5 + Math.sin(s.twinkle) * 0.5;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        });

        const sunY = horizon - 20;
        const sunRadius = Math.min(canvas.width, canvas.height) * 0.22;

        const sunGlow = ctx.createRadialGradient(cx, sunY, 0, cx, sunY, sunRadius * 2.5);
        sunGlow.addColorStop(0, "rgba(255, 180, 50, 0.5)");
        sunGlow.addColorStop(0.4, "rgba(255, 100, 150, 0.25)");
        sunGlow.addColorStop(1, "transparent");
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const sunGrad = ctx.createLinearGradient(cx, sunY - sunRadius, cx, sunY + sunRadius);
        sunGrad.addColorStop(0, "#ffeb99");
        sunGrad.addColorStop(0.2, "#ffcc00");
        sunGrad.addColorStop(0.5, "#ff6699");
        sunGrad.addColorStop(1, "#cc3399");
        
        ctx.beginPath();
        ctx.arc(cx, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fillStyle = sunGrad;
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.ellipse(cx - 18, sunY - 8, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 14, sunY - 6, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const groundGrad = ctx.createLinearGradient(0, horizon, 0, canvas.height);
        groundGrad.addColorStop(0, "#1a0530");
        groundGrad.addColorStop(0.5, "#2d0a40");
        groundGrad.addColorStop(1, "#150820");
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);

        ctx.save();
        ctx.strokeStyle = "rgba(255, 70, 180, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(255, 100, 200, 0.8)";
        ctx.shadowBlur = 8;

        for (let y = 0; y < 15; y++) {
            const baseY = horizon + 20 + y * y * 3;
            const yPos = (baseY + gridOffset * (1 + y * 0.15)) % (canvas.height - horizon);
            if (yPos < horizon + 15) continue;

            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvas.width, yPos);
            ctx.globalAlpha = 1 - (y / 15);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        for (let i = 0; i <= 20; i++) {
            const x = (i / 20) * canvas.width;
            const vanishingX = cx + (x - cx) * 0.08;
            
            ctx.beginPath();
            ctx.moveTo(x, horizon + 20);
            ctx.lineTo(vanishingX, canvas.height);
            ctx.globalAlpha = 0.4;
            ctx.stroke();
        }

        ctx.restore();

        const cx2 = canvas.width / 2;
        const carY = canvas.height - 80;
        
        ctx.save();
        ctx.fillStyle = "#ff3399";
        ctx.fillRect(cx2 - 80, carY, 160, 25);
        
        ctx.fillStyle = "#ff66b2";
        ctx.beginPath();
        ctx.moveTo(cx2 - 70, carY);
        ctx.lineTo(cx2 + 70, carY);
        ctx.lineTo(cx2 + 55, carY - 30);
        ctx.lineTo(cx2 - 60, carY - 30);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(200, 240, 255, 0.15)";
        ctx.fillRect(cx2 - 60, carY - 20, 50, 15);

        ctx.fillStyle = "#111";
        ctx.fillRect(cx2 - 70, carY - 3, 25, 6);
        ctx.fillRect(cx2 + 40, carY - 3, 25, 6);

        ctx.fillStyle = "#ffff00";
        ctx.fillRect(cx2 - 55, carY - 25, 6, 3);
        ctx.fillRect(cx2 + 45, carY - 25, 6, 3);

        ctx.fillStyle = "#ff0000";
        ctx.fillRect(cx2 - 75, carY + 18, 12, 5);
        ctx.fillRect(cx2 + 60, carY + 18, 12, 5);

        ctx.fillStyle = "rgba(255, 0, 150, 0.3)";
        ctx.fillRect(cx2 - 150, carY + 10, 80, 3);
        
        ctx.restore();

        for (let y = 0; y < canvas.height; y += 3) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
            ctx.fillRect(0, y, canvas.width, 1.5);
        }

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