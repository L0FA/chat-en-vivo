// ============================================
// 🌌 TEMA GALAXY - Gargantua Masivo
// ============================================

export function createGalaxyAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;
    let time = 0;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const holeRadius = Math.min(canvas.width, canvas.height) * 0.18;

    const stars = Array.from({ length: 600 }, () => createStar());
    const accretionDisk = Array.from({ length: 300 }, () => createDiskParticle());

    function createStar() {
        const angle = Math.random() * Math.PI * 2;
        const maxDist = Math.max(canvas.width, canvas.height);
        return {
            angle,
            radius: holeRadius * 1.5 + Math.random() * maxDist,
            size: 0.4 + Math.random() * 2,
            speed: 0.0001 + Math.random() * 0.0004,
            hue: 180 + Math.random() * 80,
            suction: 0.08 + Math.random() * 0.25,
            brightness: 50 + Math.random() * 50
        };
    }

    function createDiskParticle() {
        return {
            angle: Math.random() * Math.PI * 2,
            distance: holeRadius * 1.05 + Math.random() * holeRadius * 2.5,
            speed: 0.003 + Math.random() * 0.008,
            size: 0.5 + Math.random() * 2.5,
            hue: 20 + Math.random() * 30
        };
    }

    const drawGargantua = () => {
        // Brillo difuso
        const bgGlow = ctx.createRadialGradient(centerX, centerY, holeRadius * 0.8, centerX, centerY, holeRadius * 5);
        bgGlow.addColorStop(0, "rgba(255, 140, 40, 0.08)");
        bgGlow.addColorStop(0.5, "rgba(180, 60, 20, 0.03)");
        bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Disco de acreción (elipse aplastada)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1, 0.22);
        
        accretionDisk.forEach(p => {
            p.angle += p.speed;
            const x = Math.cos(p.angle) * p.distance;
            const y = Math.sin(p.angle) * p.distance;
            
            const alpha = 0.4 + Math.sin(p.angle * 3) * 0.2;
            ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Lente gravitacional superior
            ctx.fillStyle = `hsla(${p.hue + 10}, 80%, 50%, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(x * 0.6, -Math.abs(y) - holeRadius * 1.4, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // Anillo brillante del horizonte de sucesos
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, holeRadius * 1.08, 0, Math.PI * 2);
        const ring = ctx.createRadialGradient(centerX, centerY, holeRadius * 0.98, centerX, centerY, holeRadius * 1.15);
        ring.addColorStop(0, "rgba(0,0,0,0)");
        ring.addColorStop(0.4, "rgba(255, 200, 120, 0.7)");
        ring.addColorStop(0.6, "rgba(255, 255, 255, 0.9)");
        ring.addColorStop(0.8, "rgba(255, 200, 120, 0.5)");
        ring.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ring;
        ctx.fill();
        ctx.restore();

        // Centro negro absoluto
        ctx.beginPath();
        ctx.arc(centerX, centerY, holeRadius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
    };

    const animate = () => {
        if (stopped) return;
        time += 0.004;

        ctx.fillStyle = "#010005";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Estrellas orbitando y siendo succionadas
        stars.forEach(s => {
            s.angle += s.speed * (1 + (holeRadius * 3) / Math.max(s.radius, 1));
            s.radius -= s.suction;
            
            if (s.radius < holeRadius * 0.8) {
                Object.assign(s, createStar());
                s.radius = Math.max(canvas.width, canvas.height) * (0.5 + Math.random() * 0.5);
            }

            const x = centerX + Math.cos(s.angle) * s.radius;
            const y = centerY + Math.sin(s.angle) * s.radius;

            const distFactor = Math.min(1, s.radius / (holeRadius * 4));
            ctx.fillStyle = `hsla(${s.hue}, 80%, ${s.brightness}%, ${distFactor * 0.9})`;
            ctx.beginPath();
            ctx.arc(x, y, s.size * distFactor, 0, Math.PI * 2);
            ctx.fill();
        });

        drawGargantua();

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