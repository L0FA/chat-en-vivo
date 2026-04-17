// ============================================
// 🌅 TEMA RETRO - Outrun Synthwave 80s
// ============================================

export function createRetroAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let gridOffset = 0;
    const horizon = canvas.height * 0.5;
    const cx = canvas.width / 2;

    const stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * horizon * 0.7,
        size: 0.5 + Math.random() * 1.2,
        blink: Math.random() * Math.PI * 2
    }));

    const mountains = [
        { peaks: [], h: 200, c1: "#5c1a4a", c2: "#7a2a5c", c3: "#a03d80" },
        { peaks: [], h: 140, c1: "#3a1240", c2: "#501a5c", c3: "#702a7a" },
        { peaks: [], h: 80, c1: "#1a0a20", c2: "#2a1040", c3: "#401a60" }
    ];

    mountains.forEach(m => {
        for (let x = -100; x <= canvas.width + 100; x += 40) {
            m.peaks.push({ x, h: m.h * (0.5 + Math.random() * 0.6) });
        }
    });

    const animate = () => {
        if (stopped) return;
        gridOffset = (gridOffset + 2) % 35;

        // CIELO - Gradiente SIN opacidad
        const sky = ctx.createLinearGradient(0, 0, 0, horizon);
        sky.addColorStop(0, "#080010");
        sky.addColorStop(0.2, "#15002a");
        sky.addColorStop(0.5, "#2d0050");
        sky.addColorStop(0.8, "#500080");
        sky.addColorStop(1, "#7000a0");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ESTRELLAS
        stars.forEach(s => {
            s.blink += 0.04;
            const a = 0.5 + Math.sin(s.blink) * 0.5;
            ctx.fillStyle = `rgb(255, 255, 255)`;
            ctx.globalAlpha = a;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // SOL - Grande y colorful
        const sunY = horizon - 50;
        const sunR = Math.min(canvas.width, canvas.height) * 0.22;

        // Glow del sol
        const glow = ctx.createRadialGradient(cx, sunY, 0, cx, sunY, sunR * 3);
        glow.addColorStop(0, "rgb(255, 200, 100)");
        glow.addColorStop(0.3, "rgb(255, 100, 150)");
        glow.addColorStop(0.7, "rgb(200, 50, 100)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, canvas.width, horizon + 80);

        // Cuerpo del sol
        const sunGrad = ctx.createLinearGradient(cx, sunY - sunR, cx, sunY + sunR);
        sunGrad.addColorStop(0, "#ffffcc");
        sunGrad.addColorStop(0.15, "#ffff00");
        sunGrad.addColorStop(0.4, "#ffaa00");
        sunGrad.addColorStop(0.7, "#ff5500");
        sunGrad.addColorStop(1, "#ff0077");
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(cx, sunY, sunR, 0, Math.PI * 2);
        ctx.fill();

        // Ojos del sol (estilo anime retro)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(cx - 20, sunY - 5, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 16, sunY - 3, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas
        ctx.fillStyle = "#220044";
        ctx.beginPath();
        ctx.arc(cx - 18, sunY - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 18, sunY - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // MONTAÑAS - Capas coloridas SIN opacidad
        mountains.forEach((m, idx) => {
            const mg = ctx.createLinearGradient(0, horizon - m.h, 0, horizon);
            mg.addColorStop(0, m.c1);
            mg.addColorStop(0.5, m.c2);
            mg.addColorStop(1, m.c3);
            ctx.fillStyle = mg;
            
            ctx.beginPath();
            ctx.moveTo(-100, horizon);
            m.peaks.forEach((p, i) => {
                ctx.lineTo(p.x - idx * 40, horizon - p.h + Math.sin(i) * 10);
            });
            ctx.lineTo(canvas.width + 100, horizon);
            ctx.closePath();
            ctx.fill();
        });

        // SUELO - Gradiente oscuro SIN opacidad
        const ground = ctx.createLinearGradient(0, horizon, 0, canvas.height);
        ground.addColorStop(0, "#0a0015");
        ground.addColorStop(0.5, "#150025");
        ground.addColorStop(1, "#250040");
        ctx.fillStyle = ground;
        ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);

        // GRID - Líneas vibrantes y fluidas
        ctx.save();
        ctx.strokeStyle = "rgb(255, 80, 180)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgb(255, 100, 220)";
        ctx.shadowBlur = 15;

        // Horizontales - movimiento fluido
        for (let i = 0; i < 20; i++) {
            const base = horizon + 30 + i * i * 4;
            const y = base + gridOffset * (1 + i * 0.1);
            const wrappedY = ((y - horizon) % (canvas.height - horizon - 30)) + horizon + 30;
            
            const alpha = 1 - (i / 20);
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.moveTo(0, wrappedY);
            ctx.lineTo(canvas.width, wrappedY);
            ctx.stroke();
        }

        // Verticales - perspectiva convergente
        ctx.globalAlpha = 0.9;
        for (let i = -18; i <= 18; i++) {
            const x = cx + i * (canvas.width / 20);
            const vanishX = cx + i * 12;
            
            ctx.beginPath();
            ctx.moveTo(x, canvas.height);
            ctx.lineTo(vanishX, horizon + 30);
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