// ============================================
// 🌊 TEMA OCEAN - Profundidad marina (Sin opacidad blanca)
// ============================================

export function createOceanAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    // Partículas/burbujas con profundidad real
    const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 3,
        depth: Math.random(),
        speedY: 0.2 + Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.2,
        alpha: 0.3 + Math.random() * 0.4
    }));

    // Peces con siluetas oscuras
    const fish = Array.from({ length: 6 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        speed: 0.3 + Math.random() * 0.6,
        size: 30 + Math.random() * 50,
        dir: Math.random() > 0.5 ? 1 : -1,
        depth: Math.random(),
        wiggle: Math.random() * Math.PI * 2
    }));

    const drawFish = (f) => {
        const scale = 0.4 + f.depth * 0.6;
        const width = f.size * scale;
        const height = width * 0.35;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.dir, 1);

        // Cuerpo del pez - silueta oscura con gradiente
        const fishGradient = ctx.createLinearGradient(-width/2, -height, width/2, height);
        fishGradient.addColorStop(0, `rgba(10, 30, 50, ${0.4 + f.depth * 0.4})`);
        fishGradient.addColorStop(1, `rgba(5, 15, 30, ${0.6 + f.depth * 0.3})`);

        ctx.fillStyle = fishGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cola del pez
        ctx.beginPath();
        ctx.moveTo(-width * 0.4, 0);
        ctx.lineTo(-width * 0.7, height * 0.4);
        ctx.lineTo(-width * 0.7, -height * 0.4);
        ctx.closePath();
        ctx.fill();

        // Aleta dorsal
        ctx.beginPath();
        ctx.moveTo(-width * 0.2, -height * 0.3);
        ctx.quadraticCurveTo(0, -height * 0.8, width * 0.2, -height * 0.3);
        ctx.fill();

        ctx.restore();
    };

    const animate = () => {
        if (stopped) return;

        // Gradiente de profundidad - de azul oscuro a casi negro
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#001a33");
        gradient.addColorStop(0.3, "#002244");
        gradient.addColorStop(0.6, "#001a33");
        gradient.addColorStop(1, "#000a15");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Capas de profundidad (más oscuro abajo)
        const depthOverlay = ctx.createLinearGradient(0, 0, 0, canvas.height);
        depthOverlay.addColorStop(0, "transparent");
        depthOverlay.addColorStop(1, "rgba(0, 5, 10, 0.4)");
        ctx.fillStyle = depthOverlay;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Partículas/burbujas
        particles.forEach(p => {
            const depthFactor = 0.4 + p.depth * 0.6;
            p.y -= p.speedY * depthFactor;
            p.x += p.speedX * depthFactor + Math.sin(p.y * 0.01) * 0.15;

            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            // Burbujas con brillo azulado sutil
            const bubbleAlpha = p.alpha * (0.3 + p.depth * 0.5);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * depthFactor, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 180, 255, ${bubbleAlpha})`;
            ctx.fill();

            // Brillo interior de la burbuja
            ctx.beginPath();
            ctx.arc(p.x - p.size * 0.2, p.y - p.size * 0.2, p.size * 0.3 * depthFactor, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 230, 255, ${bubbleAlpha * 0.5})`;
            ctx.fill();
        });

        // Peces
        fish.forEach(f => {
            const depthFactor = 0.5 + f.depth * 0.5;
            f.wiggle += 0.03;
            f.x += f.speed * f.dir * depthFactor;
            f.y += Math.sin(f.wiggle) * 0.2;

            if (f.x > canvas.width + 100) f.x = -100;
            if (f.x < -100) f.x = canvas.width + 100;

            drawFish(f);
        });

        // Rayos de luz desde arriba
        ctx.save();
        ctx.globalAlpha = 0.03;
        const lightGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
        lightGradient.addColorStop(0, "rgba(150, 200, 255, 0.1)");
        lightGradient.addColorStop(1, "transparent");
        ctx.fillStyle = lightGradient;

        for (let i = 0; i < 5; i++) {
            const x = (i / 5) * canvas.width;
            ctx.beginPath();
            ctx.moveTo(x - 30, 0);
            ctx.lineTo(x + 30, 0);
            ctx.lineTo(x + 60, canvas.height * 0.6);
            ctx.lineTo(x - 60, canvas.height * 0.6);
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