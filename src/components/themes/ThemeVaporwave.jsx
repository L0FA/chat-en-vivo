// ============================================
// 🌅 TEMA VAPORWAVE - Grid retro + sol al fondo
// ============================================

export function createVaporwaveAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let offset = 0;

    const animate = () => {
        if (stopped) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        offset = (offset + 0.45) % 55;

        const cx = canvas.width / 2;
        const cy = canvas.height * 0.38;
        const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, 110);
        gradient.addColorStop(0, "rgba(255,195,0,0.92)");
        gradient.addColorStop(0.45, "rgba(255,90,140,0.55)");
        gradient.addColorStop(1, "rgba(255,90,140,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, 110, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, 45, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,230,0,0.2)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx - 18, cy - 12, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 12, cy - 8, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,90,200,0.28)";
        ctx.lineWidth = 0.8;
        for (let x = 0; x < canvas.width; x += 55) {
            ctx.beginPath();
            ctx.moveTo(x, canvas.height * 0.45);
            ctx.lineTo(cx, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < 10; y++) {
            const yPos = canvas.height * 0.45 + (y * 28 + offset) * (1 + y * 0.28);
            if (yPos > canvas.height) continue;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvas.width, yPos);
            ctx.stroke();
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