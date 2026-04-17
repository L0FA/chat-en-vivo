// ============================================
// ⚡ TEMA NEON - Partículas de neón con conexiones (Optimizado)
// ============================================

export function createNeonAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    const particles = Array.from({ length: 70 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 2 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        hue: Math.random() * 120 + 100,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03
    }));

    const animate = () => {
        if (stopped) return;

        // Fondo oscuro con gradiente
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, "#0a0a1a");
        bgGradient.addColorStop(1, "#0f0f25");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Actualizar posiciones
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += p.pulseSpeed;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        });

        // Dibujar conexiones entre partículas cercanas
        ctx.lineWidth = 0.8;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    const alpha = (1 - dist / 120) * 0.4;
                    const gradient = ctx.createLinearGradient(
                        particles[i].x, particles[i].y,
                        particles[j].x, particles[j].y
                    );
                    gradient.addColorStop(0, `hsla(${particles[i].hue}, 100%, 60%, ${alpha})`);
                    gradient.addColorStop(1, `hsla(${particles[j].hue}, 100%, 60%, ${alpha})`);

                    ctx.strokeStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Dibujar partículas con efecto de pulso
        particles.forEach(p => {
            const pulseSize = p.size + Math.sin(p.pulse) * 1.5;
            const glowSize = pulseSize * 2;

            // Glow exterior
            const outerGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
            outerGlow.addColorStop(0, `hsla(${p.hue}, 100%, 60%, 0.3)`);
            outerGlow.addColorStop(1, "transparent");
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Núcleo brillante
            ctx.beginPath();
            ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, 0.9)`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, 1)`;
            ctx.fill();
            ctx.shadowBlur = 0;
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