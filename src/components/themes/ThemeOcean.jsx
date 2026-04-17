// ============================================
// 🌊 TEMA OCEAN - Océano profundo SIN opacidad
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    const fish = Array.from({ length: 8 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.75,
        speed: 0.3 + Math.random() * 0.5,
        size: 25 + Math.random() * 35,
        body: `hsl(${195 + Math.random() * 20}, ${30 + Math.random() * 15}%, ${15 + Math.random() * 10}%)`,
        belly: `hsl(${200 + Math.random() * 15}, ${25 + Math.random() * 10}%, ${20 + Math.random() * 10}%)`,
        fin: `hsl(${190 + Math.random() * 20}, ${35 + Math.random() * 15}%, ${12 + Math.random() * 8}%)`,
        dir: Math.random() > 0.5 ? 1 : -1,
        wiggle: Math.random() * Math.PI * 2
    }));

    const algae = Array.from({ length: 10 }, () => ({
        x: Math.random() * canvas.width,
        baseY: canvas.height,
        height: 40 + Math.random() * 70,
        segments: 3 + Math.floor(Math.random() * 3),
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.01,
        color: `hsl(${110 + Math.random() * 20}, ${35 + Math.random() * 15}%, ${12 + Math.random() * 8}%)`
    }));

    const drawFish = (f) => {
        const w = f.size;
        const h = w * 0.4;
        
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.dir, 1);

        // Cuerpo oscuro sólido
        ctx.fillStyle = f.body;
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cola
        ctx.fillStyle = f.fin;
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, 0);
        ctx.lineTo(-w * 0.6, h * 0.5);
        ctx.lineTo(-w * 0.5, 0);
        ctx.lineTo(-w * 0.6, -h * 0.5);
        ctx.closePath();
        ctx.fill();

        // Aleta dorsal
        ctx.beginPath();
        ctx.moveTo(-w * 0.1, -h * 0.3);
        ctx.lineTo(0, -h * 0.6);
        ctx.lineTo(w * 0.1, -h * 0.3);
        ctx.closePath();
        ctx.fill();

        // Ojo
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(w * 0.25, -h * 0.05, h * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(w * 0.27, -h * 0.05, h * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawAlgae = (a) => {
        ctx.save();
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";

        const segH = a.height / a.segments;
        
        ctx.beginPath();
        ctx.moveTo(a.x, a.baseY);
        
        for (let i = 1; i <= a.segments; i++) {
            const sway = Math.sin(time * a.speed + a.phase + i * 0.7) * (i * 2);
            ctx.lineTo(a.x + sway, a.baseY - i * segH);
        }
        
        ctx.stroke();
        ctx.restore();
    };

    const animate = () => {
        if (stopped) return;
        time += 0.02;

        // FONDO - Negro total, SIN glow, SIN opacidad
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Capa oscuraextra (sólida, no con opacidad)
        ctx.fillStyle = "#000508";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Algas al fondo
        algae.forEach(a => drawAlgae(a));

        // Peces
        fish.forEach(f => {
            f.wiggle += 0.035;
            f.x += f.speed * f.dir;
            f.y += Math.sin(f.wiggle) * 0.2;

            if (f.x > canvas.width + 50) f.x = -50;
            if (f.x < -50) f.x = canvas.width + 50;

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