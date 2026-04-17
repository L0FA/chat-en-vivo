// ============================================
// 🌅 TEMA VAPORWAVE - Grid retro + auto hacia el sol
// ============================================

export function createVaporwaveAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let offset = 0;
    let carY = 0;

    const animate = () => {
        if (stopped) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        offset = (offset + 0.45) % 55;
        carY += 1.2;
        if (carY > canvas.height * 0.32) carY = 0;

        const cx = canvas.width / 2;
        const cy = canvas.height * 0.35;
        const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, 120);
        gradient.addColorStop(0, "rgba(255,200,0,0.95)");
        gradient.addColorStop(0.4, "rgba(255,90,145,0.6)");
        gradient.addColorStop(1, "rgba(255,90,145,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,235,0,0.25)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - 20, cy - 14, 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 14, cy - 10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,90,200,0.15)";
        ctx.fillRect(0, 0, canvas.width, cy + 60);

        ctx.strokeStyle = "rgba(255,90,200,0.3)";
        ctx.lineWidth = 0.8;
        for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, canvas.height * 0.42);
            ctx.lineTo(cx, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < 10; y++) {
            const yPos = canvas.height * 0.42 + (y * 26 + offset) * (1 + y * 0.28);
            if (yPos > canvas.height) continue;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvas.width, yPos);
            ctx.stroke();
        }

        const carX = cx;
        const carPosY = canvas.height * 0.78;
        const scale = 0.25 + (carY / (canvas.height * 0.32)) * 0.15;
        
        const carW = 40 * scale * 3;
        const carH = 16 * scale * 3;
        
        ctx.fillStyle = "#ff1a75";
        ctx.fillRect(carX - carW/2, carPosY - carH, carW, carH);
        
        ctx.fillStyle = "#ff4da6";
        ctx.fillRect(carX - carW * 0.4, carPosY - carH * 1.5, carW * 0.8, carH * 0.6);
        
        ctx.fillStyle = "#000";
        ctx.fillRect(carX - carW * 0.35, carPosY - 2, 8, 5);
        ctx.fillRect(carX + carW * 0.2, carPosY - 2, 8, 5);
        
        ctx.fillStyle = "rgba(255,255,180,0.8)";
        ctx.fillRect(carX - carW * 0.25, carPosY - carH * 0.8, 4, 2);
        ctx.fillRect(carX + carW * 0.15, carPosY - carH * 0.8, 4, 2);

        ctx.fillStyle = "rgba(255,1,130,0.08)";
        ctx.fillRect(cx - carW * 1.5, carPosY - carH, carW * 3, carH * 0.3);

        for (let y = 0; y < canvas.height; y += 3) {
            ctx.fillStyle = "rgba(0,0,0,0.04)";
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