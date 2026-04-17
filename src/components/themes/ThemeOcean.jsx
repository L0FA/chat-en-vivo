// ============================================
// 🌊 TEMA OCEAN - Océano profundo con peces realistas y algas
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    const bubbles = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1.5 + Math.random() * 4,
        speed: 0.4 + Math.random() * 0.6,
        wobble: Math.random() * Math.PI * 2,
        alpha: 0.2 + Math.random() * 0.25
    }));

    const fishColors = [
        { body: "#0a2a3a", belly: "#1a4a5a", fin: "#0d3545" },
        { body: "#051520", belly: "#0a2530", fin: "#031520" },
        { body: "#152a35", belly: "#1a3540", fin: "#102030" },
        { body: "#081828", belly: "#0c2030", fin: "#061520" },
        { body: "#1a2530", belly: "#203540", fin: "#151e28" }
    ];

    const fish = Array.from({ length: 10 }, () => {
        const c = fishColors[Math.floor(Math.random() * fishColors.length)];
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.7,
            speed: 0.3 + Math.random() * 0.6,
            size: 30 + Math.random() * 40,
            ...c,
            dir: Math.random() > 0.5 ? 1 : -1,
            wiggle: Math.random() * Math.PI * 2,
            waveAmp: 0.5 + Math.random() * 0.5
        };
    });

    const algae = Array.from({ length: 12 }, () => ({
        x: Math.random() * canvas.width,
        baseY: canvas.height,
        height: 50 + Math.random() * 80,
        segments: 4 + Math.floor(Math.random() * 3),
        phase: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.015,
        hue: 100 + Math.random() * 30
    }));

    const drawFish = (f) => {
        const w = f.size;
        const h = w * 0.45;
        
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.dir, 1);

        // Cuerpo con gradiente
        const bodyGrad = ctx.createLinearGradient(0, -h/2, 0, h/2);
        bodyGrad.addColorStop(0, f.body);
        bodyGrad.addColorStop(0.5, f.belly);
        bodyGrad.addColorStop(1, f.body);
        
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cola - más realista y fluida
        ctx.fillStyle = f.fin;
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, 0);
        ctx.quadraticCurveTo(-w * 0.55, h * 0.4, -w * 0.7, h * 0.6);
        ctx.lineTo(-w * 0.6, 0);
        ctx.lineTo(-w * 0.7, -h * 0.6);
        ctx.quadraticCurveTo(-w * 0.55, -h * 0.4, -w * 0.35, 0);
        ctx.fill();

        // Aleta dorsal
        ctx.beginPath();
        ctx.moveTo(-w * 0.1, -h * 0.35);
        ctx.quadraticCurveTo(0, -h * 0.75, w * 0.15, -h * 0.35);
        ctx.closePath();
        ctx.fill();

        // Aleta pectoral
        ctx.beginPath();
        ctx.ellipse(w * 0.05, h * 0.15, w * 0.12, h * 0.15, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Aleta ventral
        ctx.beginPath();
        ctx.moveTo(-w * 0.05, h * 0.25);
        ctx.quadraticCurveTo(w * 0.05, h * 0.45, w * 0.1, h * 0.25);
        ctx.closePath();
        ctx.fill();

        // Brillo lateral
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.ellipse(w * 0.1, 0, w * 0.3, h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ojo
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(w * 0.28, -h * 0.05, h * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(w * 0.31, -h * 0.05, h * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(w * 0.33, -h * 0.08, h * 0.03, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawAlgae = (a) => {
        ctx.save();
        ctx.strokeStyle = `hsl(${a.hue}, 50%, 18%)`;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        const segH = a.height / a.segments;
        
        ctx.beginPath();
        ctx.moveTo(a.x, a.baseY);
        
        for (let i = 1; i <= a.segments; i++) {
            const sway = Math.sin(time * a.speed + a.phase + i * 0.6) * (i * 2.5);
            ctx.lineTo(a.x + sway, a.baseY - i * segH);
        }
        
        ctx.stroke();

        // Hojas
        for (let i = 1; i < a.segments; i++) {
            const leafY = a.baseY - i * segH;
            const sway = Math.sin(time * a.speed + a.phase + i * 0.6) * (i * 2.5);
            const leafX = a.x + sway;
            const dir = i % 2 === 0 ? 1 : -1;
            const leafSize = 6 + Math.random() * 6;
            
            ctx.fillStyle = `hsl(${a.hue + 10}, 45%, 15%)`;
            ctx.beginPath();
            ctx.ellipse(leafX + dir * 8, leafY, leafSize, 3, dir * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    const animate = () => {
        if (stopped) return;
        time += 0.025;

        // FONDO - Muy oscuro, SIN blancura
        ctx.fillStyle = "#000810";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Capa de profundidad oscura
        const deepGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        deepGrad.addColorStop(0, "#001020");
        deepGrad.addColorStop(0.5, "#000c18");
        deepGrad.addColorStop(1, "#000508");
        ctx.fillStyle = deepGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Algas al fondo
        algae.forEach(a => drawAlgae(a));

        // Peces
        fish.forEach(f => {
            f.wiggle += 0.04 * f.waveAmp;
            f.x += f.speed * f.dir;
            f.y += Math.sin(f.wiggle) * 0.25;

            if (f.x > canvas.width + 60) f.x = -60;
            if (f.x < -60) f.x = canvas.width + 60;

            drawFish(f);
        });

        // Burbujas sutiles
        bubbles.forEach(b => {
            b.wobble += 0.025;
            b.y -= b.speed;
            b.x += Math.sin(b.wobble) * 0.4;

            if (b.y < -8) {
                b.y = canvas.height + 8;
                b.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(80, 150, 200, ${b.alpha})`;
            ctx.fill();
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