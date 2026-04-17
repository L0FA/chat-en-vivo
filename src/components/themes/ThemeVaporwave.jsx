// ============================================
// 🌅 TEMA VAPORWAVE - Grid retro + sol
// ============================================

export function createVaporwaveAnimation(ctx, canvas) {
    let animId = null;
    let offset = 0;

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        offset = (offset + 0.5) % 60;

        const cx = canvas.width / 2;
        const cy = canvas.height * 0.4;
        const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 100);
        gradient.addColorStop(0, "rgba(255,200,0,0.8)");
        gradient.addColorStop(0.5, "rgba(255,100,150,0.5)");
        gradient.addColorStop(1, "rgba(255,100,150,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, 100, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = "rgba(255,100,200,0.3)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, canvas.height * 0.5);
            ctx.lineTo(cx, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < 8; y++) {
            const yPos = canvas.height * 0.5 + (y * 30 + offset) * 0.8;
            if (yPos > canvas.height || yPos < 0) continue;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvas.width, yPos);
            ctx.stroke();
        }

        animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animId) cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
}