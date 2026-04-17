// ============================================
// 🌊 TEMA OCEAN - Océano profundo con peces y algas
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    // Burbujas - más visibles
    const bubbles = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 5,
        speed: 0.3 + Math.random() * 0.8,
        wobble: Math.random() * Math.PI * 2,
        alpha: 0.3 + Math.random() * 0.4
    }));

    // Peces - más cantidad y diversos
    const fishTypes = [
        { color: "#1a4a6e", sizeRange: [25, 45] },
        { color: "#0d3a50", sizeRange: [35, 60] },
        { color: "#2a5a7a", sizeRange: [20, 35] }
    ];

    const fish = Array.from({ length: 12 }, () => {
        const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.8,
            speed: 0.4 + Math.random() * 0.8,
            size: type.sizeRange[0] + Math.random() * (type.sizeRange[1] - type.sizeRange[0]),
            color: type.color,
            dir: Math.random() > 0.5 ? 1 : -1,
            wiggle: Math.random() * Math.PI * 2
        };
    });

    // Algas en el fondo - movimientos suaves
    const algae = Array.from({ length: 15 }, () => ({
        x: Math.random() * canvas.width,
        baseY: canvas.height + Math.random() * 50,
        height: 60 + Math.random() * 100,
        segments: 5 + Math.floor(Math.random() * 4),
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.02,
        color: `hsl(${140 + Math.random() * 20}, ${40 + Math.random() * 20}%, ${20 + Math.random() * 15}%)`
    }));

    const drawFish = (f) => {
        const w = f.size;
        const h = w * 0.4;
        
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.dir, 1);

        // Cuerpo del pez
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cola
        ctx.beginPath();
        ctx.moveTo(-w * 0.4, 0);
        ctx.lineTo(-w * 0.7, h * 0.5);
        ctx.lineTo(-w * 0.7, -h * 0.5);
        ctx.closePath();
        ctx.fill();

        // Aleta superior
        ctx.beginPath();
        ctx.moveTo(-w * 0.1, -h * 0.3);
        ctx.quadraticCurveTo(w * 0.1, -h * 0.7, w * 0.2, -h * 0.3);
        ctx.fill();

        // Aleta inferior
        ctx.beginPath();
        ctx.moveTo(-w * 0.1, h * 0.2);
        ctx.quadraticCurveTo(w * 0.05, h * 0.5, w * 0.15, h * 0.2);
        ctx.fill();

        // Ojo
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(w * 0.25, -h * 0.1, h * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(w * 0.28, -h * 0.1, h * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawAlgae = (a) => {
        ctx.save();
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 5;

        const segmentH = a.height / a.segments;
        
        ctx.beginPath();
        ctx.moveTo(a.x, a.baseY);
        
        for (let i = 1; i <= a.segments; i++) {
            const sway = Math.sin(time * a.speed + a.phase + i * 0.5) * (i * 3);
            ctx.lineTo(a.x + sway, a.baseY - i * segmentH);
        }
        
        ctx.stroke();

        // Hojas pequeñas en las algas
        for (let i = 1; i < a.segments; i++) {
            const leafY = a.baseY - i * segmentH;
            const sway = Math.sin(time * a.speed + a.phase + i * 0.5) * (i * 3);
            const leafX = a.x + sway;
            
            const leafSize = 8 + Math.random() * 8;
            const dir = i % 2 === 0 ? 1 : -1;
            
            ctx.fillStyle = a.color;
            ctx.beginPath();
            ctx.ellipse(leafX + dir * 6, leafY, leafSize, 3, dir * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    const animate = () => {
        if (stopped) return;
        time += 0.03;

        // FONDO - Oscuro y profundo SIN opacidad
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, "#001122");
        bgGrad.addColorStop(0.3, "#001a33");
        bgGrad.addColorStop(0.6, "#001830");
        bgGrad.addColorStop(1, "#000a15");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ALGAS - al fondo
        algae.forEach(a => drawAlgae(a));

        // Peces
        fish.forEach(f => {
            f.wiggle += 0.05;
            f.x += f.speed * f.dir;
            f.y += Math.sin(f.wiggle) * 0.3;

            if (f.x > canvas.width + 80) f.x = -80;
            if (f.x < -80) f.x = canvas.width + 80;

            drawFish(f);
        });

        // Burbujas
        bubbles.forEach(b => {
            b.wobble += 0.03;
            b.y -= b.speed;
            b.x += Math.sin(b.wobble) * 0.5;

            if (b.y < -10) {
                b.y = canvas.height + 10;
                b.x = Math.random() * canvas.width;
            }

            // Burbuja principal
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(150, 200, 255, ${b.alpha})`;
            ctx.fill();

            // Brillo de la burbuja
            ctx.beginPath();
            ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.6})`;
            ctx.fill();
        });

        // Rayos de luz desde arriba - más sutiles
        ctx.save();
        const lightGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
        lightGrad.addColorStop(0, "rgba(100, 180, 255, 0.08)");
        lightGrad.addColorStop(1, "transparent");
        ctx.fillStyle = lightGrad;

        for (let i = 0; i < 6; i++) {
            const x = (i / 6) * canvas.width + 50;
            ctx.beginPath();
            ctx.moveTo(x - 20, 0);
            ctx.lineTo(x + 20, 0);
            ctx.lineTo(x + 50, canvas.height * 0.5);
            ctx.lineTo(x - 50, canvas.height * 0.5);
            ctx.closePath();
            ctx.fill();
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