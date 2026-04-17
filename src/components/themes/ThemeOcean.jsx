// ============================================
// 🌊 TEMA OCEAN - Océano con Peces Realistas
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    // Burbujas
    const bubbles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        size: 1 + Math.random() * 4,
        speedY: 0.3 + Math.random() * 1.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03
    }));

    // Más peces, más variados
    const fishColors = [
        { body: "#e8a030", belly: "#ffe080", fin: "#d08020" },
        { body: "#4090d0", belly: "#80c0ff", fin: "#3070a0" },
        { body: "#d04040", belly: "#ff8080", fin: "#a03030" },
        { body: "#30b070", belly: "#80ffc0", fin: "#209060" },
        { body: "#a050c0", belly: "#d090f0", fin: "#8040a0" },
        { body: "#d08050", belly: "#ffc090", fin: "#b06030" },
    ];

    const fish = Array.from({ length: 15 }, () => {
        const palette = fishColors[Math.floor(Math.random() * fishColors.length)];
        return {
            x: Math.random() * canvas.width,
            y: 80 + Math.random() * (canvas.height - 250),
            speed: 0.3 + Math.random() * 0.8,
            size: 12 + Math.random() * 28,
            dir: Math.random() > 0.5 ? 1 : -1,
            wiggle: Math.random() * Math.PI * 2,
            tailPhase: Math.random() * Math.PI * 2,
            ...palette
        };
    });

    // Algas
    const algae = Array.from({ length: 14 }, () => ({
        x: Math.random() * canvas.width,
        segments: 5 + Math.floor(Math.random() * 5),
        segmentLen: 15 + Math.random() * 10,
        width: 4 + Math.random() * 4,
        offset: Math.random() * Math.PI * 2
    }));

    const drawFish = (f) => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.dir, 1);

        const tailWag = Math.sin(time * 4 + f.tailPhase) * 0.3;

        // Cola (más realista con curvas)
        ctx.fillStyle = f.fin;
        ctx.beginPath();
        ctx.moveTo(-f.size * 0.7, 0);
        ctx.quadraticCurveTo(-f.size * 1.1, -f.size * 0.5 + tailWag * f.size, -f.size * 1.3, -f.size * 0.35 + tailWag * f.size);
        ctx.quadraticCurveTo(-f.size * 1.0, tailWag * f.size * 0.5, -f.size * 1.3, f.size * 0.35 + tailWag * f.size);
        ctx.quadraticCurveTo(-f.size * 1.1, f.size * 0.5 + tailWag * f.size, -f.size * 0.7, 0);
        ctx.fill();

        // Cuerpo (forma de pez con curvas)
        ctx.fillStyle = f.body;
        ctx.beginPath();
        ctx.moveTo(f.size * 0.9, 0);
        ctx.quadraticCurveTo(f.size * 0.5, -f.size * 0.45, 0, -f.size * 0.4);
        ctx.quadraticCurveTo(-f.size * 0.5, -f.size * 0.35, -f.size * 0.7, 0);
        ctx.quadraticCurveTo(-f.size * 0.5, f.size * 0.35, 0, f.size * 0.4);
        ctx.quadraticCurveTo(f.size * 0.5, f.size * 0.45, f.size * 0.9, 0);
        ctx.fill();

        // Barriga
        ctx.fillStyle = f.belly;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.ellipse(0, f.size * 0.1, f.size * 0.5, f.size * 0.2, 0, 0, Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Aleta dorsal
        ctx.fillStyle = f.fin;
        ctx.beginPath();
        ctx.moveTo(f.size * 0.1, -f.size * 0.35);
        ctx.quadraticCurveTo(-f.size * 0.1, -f.size * 0.65, -f.size * 0.3, -f.size * 0.35);
        ctx.fill();

        // Ojo
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(f.size * 0.55, -f.size * 0.08, f.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(f.size * 0.57, -f.size * 0.08, f.size * 0.05, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawAlgae = (a, time) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a.x, canvas.height);
        let currX = a.x, currY = canvas.height;
        for (let i = 0; i < a.segments; i++) {
            const sway = Math.sin(time * 0.5 + a.offset + i * 0.3) * (i * 2.5);
            currX += sway;
            currY -= a.segmentLen;
            ctx.quadraticCurveTo(currX - sway, currY + a.segmentLen / 2, currX, currY);
        }
        ctx.strokeStyle = "#1a5d3e";
        ctx.lineWidth = a.width;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
    };

    const drawGodRays = (time) => {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (let i = 0; i < 5; i++) {
            const angle = Math.sin(time * 0.15 + i * 1.2) * 0.1 + 0.15;
            const x = (canvas.width / 5) * i + (canvas.width / 10) + Math.sin(time * 0.08 + i) * 60;
            const width = 80 + Math.sin(time * 0.2 + i) * 40;
            const grad = ctx.createLinearGradient(x, 0, x + angle * 200, canvas.height);
            grad.addColorStop(0, "rgba(255, 255, 200, 0.15)");
            grad.addColorStop(0.4, "rgba(255, 255, 200, 0.04)");
            grad.addColorStop(1, "rgba(255, 255, 200, 0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - width / 2, 0);
            ctx.lineTo(x + width / 2, 0);
            ctx.lineTo(x + width * 2 + angle * 300, canvas.height);
            ctx.lineTo(x - width * 2 + angle * 300, canvas.height);
            ctx.fill();
        }
        ctx.restore();
    };

    const animate = () => {
        if (stopped) return;
        time += 0.02;

        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, "#0077be");
        bgGrad.addColorStop(0.5, "#005a92");
        bgGrad.addColorStop(1, "#002b44");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGodRays(time);
        algae.forEach(a => drawAlgae(a, time));

        bubbles.forEach(b => {
            b.y -= b.speedY;
            b.x += Math.sin(time + b.wobble) * 0.5;
            if (b.y < -20) { b.y = canvas.height + 20; b.x = Math.random() * canvas.width; }
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.fill();
        });

        fish.forEach(f => {
            f.x += f.speed * f.dir;
            f.y += Math.sin(time + f.wiggle) * 0.3;
            if (f.x > canvas.width + 100) f.x = -100;
            if (f.x < -100) f.x = canvas.width + 100;
            drawFish(f);
        });

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