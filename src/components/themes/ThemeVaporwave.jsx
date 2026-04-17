// ============================================
// 🌅 TEMA VAPORWAVE - Sol Elevado y Limpio
// ============================================

export function createVaporwaveAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    const horizon = canvas.height * 0.7; // Más espacio arriba

    const drawSun = (time) => {
        const x = canvas.width / 2;
        const y = horizon - 150; // Elevado
        const radius = 100;
        
        // Brillo exterior
        const sunGlow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
        sunGlow.addColorStop(0, "rgba(255, 50, 150, 0.4)");
        sunGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, canvas.width, horizon);

        // Sol segmentado
        ctx.save();
        // Recortar para que el sol no pase del horizonte (la pista)
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, horizon);
        ctx.clip();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();

        const sunGrad = ctx.createLinearGradient(x, y - radius, x, y + radius);
        sunGrad.addColorStop(0, "#ffeb3b");
        sunGrad.addColorStop(1, "#f44336");
        ctx.fillStyle = sunGrad;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

        // Cortes horizontales
        ctx.globalCompositeOperation = "destination-out";
        for (let i = 0; i < 8; i++) {
            const h = 5 + i * 2;
            const py = y + radius - ((i * 30 + time * 25) % (radius * 2.5));
            if (py > y - radius) {
                ctx.fillRect(x - radius, py, radius * 2, h);
            }
        }
        ctx.restore();
    };

    const drawMountains = () => {
        ctx.save();
        const drawLayer = (color, heightMult, offset, opacity) => {
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.moveTo(0, horizon);
            for (let i = 0; i <= 10; i++) {
                const x = (canvas.width / 10) * i;
                const h = horizon - (Math.sin(i * 1.5 + offset) * 30 + heightMult);
                ctx.lineTo(x, h);
            }
            ctx.lineTo(canvas.width, horizon);
            ctx.fill();
            
            ctx.strokeStyle = "#ff00ff";
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        drawLayer("#1a0624", 50, 0.5, 1);
        drawLayer("#0d0312", 30, 1.2, 1);
        ctx.restore();
    };

    const drawGrid = (time) => {
        ctx.save();
        const gridOffset = (time * 60) % 50;
        
        ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "cyan";

        // Horizontales
        for (let i = 0; i < 20; i++) {
            const y = horizon + ((i * 50 + gridOffset) ** 1.3) / 10;
            if (y > canvas.height) continue;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.globalAlpha = Math.min(1, (y - horizon) / 50);
            ctx.stroke();
        }

        // Verticales
        const centerX = canvas.width / 2;
        for (let i = -15; i <= 15; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX + i * 10, horizon);
            ctx.lineTo(centerX + i * 300, canvas.height);
            ctx.globalAlpha = 0.3;
            ctx.stroke();
        }
        ctx.restore();
    };

    const animate = () => {
        if (stopped) return;
        time += 0.016;

        ctx.fillStyle = "#05010a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cielo
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
        skyGrad.addColorStop(0, "#05010a");
        skyGrad.addColorStop(1, "#1a0624");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, horizon);

        drawSun(time);
        drawMountains();
        drawGrid(time);

        // Scanlines
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        for (let i = 0; i < canvas.height; i += 4) {
            ctx.fillRect(0, i, canvas.width, 2);
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