// ============================================
// 🌅 TEMA VAPORWAVE - Grid retro + auto deportivo hacia el sol
// ============================================

export function createVaporwaveAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let offset = 0;
    let carZ = 0;

    const animate = () => {
        if (stopped) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        offset = (offset + 0.6) % 60;
        carZ += 1.5;
        if (carZ > canvas.height * 0.35) carZ = 0;

        const cx = canvas.width / 2;
        const horizon = canvas.height * 0.38;
        const sunGradient = ctx.createRadialGradient(cx, horizon - 30, 5, cx, horizon - 30, 130);
        sunGradient.addColorStop(0, "rgba(255,210,0,0.95)");
        sunGradient.addColorStop(0.35, "rgba(255,100,150,0.6)");
        sunGradient.addColorStop(0.7, "rgba(255,50,120,0.3)");
        sunGradient.addColorStop(1, "rgba(255,50,120,0)");
        ctx.beginPath();
        ctx.arc(cx, horizon - 30, 130, 0, Math.PI * 2);
        ctx.fillStyle = sunGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, horizon - 30, 55, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,240,0,0.3)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - 22, horizon - 42, 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 16, horizon - 38, 5, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 5; i++) {
            const lineY = horizon + 30 + i * 40;
            if (lineY > canvas.height) break;
            const alpha = 0.25 - i * 0.04;
            ctx.fillStyle = `rgba(255,90,200,${alpha})`;
            ctx.fillRect(0, lineY, canvas.width, 2);
        }

        ctx.strokeStyle = "rgba(255,90,200,0.25)";
        ctx.lineWidth = 0.6;
        for (let x = 0; x < canvas.width; x += 45) {
            ctx.beginPath();
            ctx.moveTo(x, horizon + 30);
            ctx.lineTo(cx, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < 12; y++) {
            const yPos = horizon + 30 + (y * 22 + offset) * (0.7 + y * 0.12);
            if (yPos > canvas.height) continue;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvas.width, yPos);
            ctx.stroke();
        }

        const scale = 0.2 + (carZ / (canvas.height * 0.35)) * 0.2;
        const carX = cx;
        const carY = canvas.height - 70;
        const carW = 50 * scale * 4;
        const carH = 18 * scale * 4;
        
        ctx.fillStyle = "#ff1a75";
        ctx.fillRect(carX - carW/2, carY, carW, carH);
        
        ctx.fillStyle = "#ff4da6";
        ctx.beginPath();
        ctx.moveTo(carX - carW/2, carY);
        ctx.lineTo(carX + carW/2, carY);
        ctx.lineTo(carX + carW * 0.35, carY - carH * 0.8);
        ctx.lineTo(carX - carW * 0.35, carY - carH * 0.8);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = "rgba(240,240,240,0.15)";
        ctx.fillRect(carX - carW * 0.45, carY - carH * 0.5, carW * 0.3, carH * 0.3);

        ctx.fillStyle = "#111";
        ctx.fillRect(carX - carW * 0.35, carY - 2, carW * 0.18, 5);
        ctx.fillRect(carX + carW * 0.17, carY - 2, carW * 0.18, 5);

        ctx.fillStyle = "#ffeb3b";
        ctx.fillRect(carX - carW * 0.28, carY - carH * 0.6, 4, 2);
        ctx.fillRect(carX + carW * 0.18, carY - carH * 0.6, 4, 2);
        
        ctx.fillStyle = "#f44336";
        ctx.fillRect(carX - carW * 0.3, carY + carH - 3, 5, 3);
        ctx.fillRect(carX + carW * 0.25, carY + carH - 3, 5, 3);

        ctx.fillStyle = "rgba(255,1,120,0.12)";
        ctx.fillRect(carX - carW, carY + carH, carW * 2, 3);

        for (let y = 0; y < canvas.height; y += 2.5) {
            ctx.fillStyle = "rgba(0,0,0,0.035)";
            ctx.fillRect(0, y, canvas.width, 1);
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