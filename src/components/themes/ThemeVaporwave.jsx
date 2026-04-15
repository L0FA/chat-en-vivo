// ============================================
// 🌅 TEMA VAPORWAVE - Grid retro + sol
// ============================================

export function createVaporwaveAnimation(ctx, canvas) {
    let offset = 0;

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        offset = (offset + 0.5) % 60;

        // Sol
        const cx = canvas.width / 2;
        const cy = canvas.height * 0.4;
        const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
        gradient.addColorStop(0, "rgba(255,200,0,0.9)");
        gradient.addColorStop(0.5, "rgba(255,100,150,0.6)");
        gradient.addColorStop(1, "rgba(255,100,150,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Grid
        ctx.strokeStyle = "rgba(255,100,200,0.3)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, canvas.height * 0.5);
            ctx.lineTo(cx, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < 10; y++) {
            const yPos = canvas.height * 0.5 + (y * 30 + offset) * (1 + y * 0.3);
            if (yPos > canvas.height) continue;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvas.width, yPos);
            ctx.stroke();
        }

        return requestAnimationFrame(animate);
    };

    return animate;
}