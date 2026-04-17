// ============================================
// 🌸 TEMA ROSA - Cascada de Flores Rosadas
// ============================================

export function createRosaAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    const petals = Array.from({ length: 75 }, () => createPetal());

    function createPetal() {
        return {
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * canvas.height,
            size: 6 + Math.random() * 11,
            speedY: 1 + Math.random() * 2,
            speedX: (Math.random() - 0.5) * 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            wobble: Math.random() * Math.PI * 2,
            type: Math.floor(Math.random() * 3),
            hue: 335 + Math.random() * 25,
            lightness: 75 + Math.random() * 15
        };
    }

    const drawFlower = (p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation + Math.sin(time + p.wobble) * 0.4);
        ctx.globalAlpha = 0.8;

        const color = `hsl(${p.hue}, 80%, ${p.lightness}%)`;
        ctx.fillStyle = color;

        if (p.type === 0) {
            // Flor de 5 pétalos
            for (let i = 0; i < 5; i++) {
                ctx.save();
                ctx.rotate((Math.PI * 2 / 5) * i);
                ctx.beginPath();
                ctx.ellipse(0, -p.size * 0.5, p.size * 0.28, p.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.fillStyle = "#fff0c0";
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.12, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 1) {
            // Pétalo simple
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-p.size, -p.size, 0, -p.size * 1.4);
            ctx.quadraticCurveTo(p.size, -p.size, 0, 0);
            ctx.fill();
        } else {
            // Cerezo 4 pétalos
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate((Math.PI / 2) * i);
                ctx.beginPath();
                ctx.arc(p.size * 0.3, 0, p.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    const animate = () => {
        if (stopped) return;
        time += 0.015;

        // Fondo rosa oscuro para contraste
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, "#4a1025");
        bgGrad.addColorStop(1, "#2d0a16");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        petals.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(time + p.wobble) * 1.2;
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