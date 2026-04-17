// ============================================
// 🌸 TEMA DARKPINK - Flores Rosa en Modo Oscuro
// ============================================

export function createDarkPinkAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    const petals = Array.from({ length: 70 }, () => createPetal());

    function createPetal() {
        return {
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * canvas.height,
            size: 6 + Math.random() * 12,
            speedY: 0.8 + Math.random() * 1.8,
            speedX: (Math.random() - 0.5) * 1.2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.08,
            wobble: Math.random() * Math.PI * 2,
            type: Math.floor(Math.random() * 3), // 3 tipos de flor
            hue: 320 + Math.random() * 30,
            lightness: 60 + Math.random() * 20
        };
    }

    const drawFlower = (p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation + Math.sin(time + p.wobble) * 0.3);
        ctx.globalAlpha = 0.75;

        const color = `hsl(${p.hue}, 70%, ${p.lightness}%)`;
        const darkColor = `hsl(${p.hue}, 60%, ${p.lightness - 15}%)`;
        ctx.fillStyle = color;

        if (p.type === 0) {
            // Flor de 5 pétalos
            for (let i = 0; i < 5; i++) {
                ctx.save();
                ctx.rotate((Math.PI * 2 / 5) * i);
                ctx.beginPath();
                ctx.ellipse(0, -p.size * 0.5, p.size * 0.3, p.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            // Centro
            ctx.fillStyle = "#ffcc80";
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 1) {
            // Pétalo simple (rosa clásico)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-p.size, -p.size, 0, -p.size * 1.4);
            ctx.quadraticCurveTo(p.size, -p.size, 0, 0);
            ctx.fill();
        } else {
            // Flor de cerezo (4 pétalos redondeados)
            ctx.fillStyle = darkColor;
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate((Math.PI / 2) * i);
                ctx.beginPath();
                ctx.arc(p.size * 0.35, 0, p.size * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.fillStyle = "#ffe0e0";
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    const animate = () => {
        if (stopped) return;
        time += 0.012;

        // Fondo oscuro con toque rosa
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, "#1a0a14");
        bgGrad.addColorStop(0.5, "#220e1a");
        bgGrad.addColorStop(1, "#150810");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        petals.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(time + p.wobble) * 1;
            p.rotation += p.rotationSpeed;
            if (p.y > canvas.height + 20) {
                Object.assign(p, createPetal());
                p.y = -20;
            }
            drawFlower(p);
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