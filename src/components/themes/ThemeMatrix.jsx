// ============================================
// 📟 TEMA MATRIX - Lluvia digital (Fix + Mejorado)
// ============================================

export function createMatrixAnimation(ctx, canvas) {
    const katakana = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);

    // Inicializar gotas con velocidades variables
    const drops = Array.from({ length: columns }, () => ({
        y: Math.floor(Math.random() * -50),
        speed: 0.5 + Math.random() * 1.2,
        chars: Array.from({ length: 25 }, () => katakana.charAt(Math.floor(Math.random() * katakana.length))),
        hue: 120 + Math.random() * 40
    }));

    let animId = null;
    let stopped = false;
    let frame = 0;

    const animate = () => {
        if (stopped) return;
        frame++;

        // Efecto de rastro suave
        ctx.fillStyle = "rgba(0, 2, 0, 0.06)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${fontSize}px monospace`;

        drops.forEach((drop, i) => {
            const x = i * fontSize;
            const y = drop.y * fontSize;

            // Caracter principal (cabeza) - siempre blanco brillante
            const headChar = drop.chars[0] || "0";
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "#00ff41";
            ctx.shadowBlur = 12;
            ctx.fillText(headChar, x, y);
            ctx.shadowBlur = 0;

            // Estela de caracteres detrás
            for (let j = 1; j <= 15; j++) {
                const charY = y - j * fontSize;
                if (charY < -fontSize) continue;

                const alpha = Math.max(0.1, 1 - j / 15);
                const charIndex = (frame + j) % drop.chars.length;
                const char = drop.chars[charIndex] || "0";

                ctx.fillStyle = `hsla(${drop.hue}, 100%, ${40 + j * 2}%, ${alpha})`;
                ctx.shadowColor = `hsla(${drop.hue}, 100%, 50%, ${alpha})`;
                ctx.shadowBlur = j < 5 ? 6 : 0;
                ctx.fillText(char, x, charY);
                ctx.shadowBlur = 0;
            }

            // Mover gota hacia abajo
            drop.y += drop.speed;

            // Resetear gota cuando sale de pantalla
            if (drop.y * fontSize > canvas.height + 100) {
                drop.y = Math.floor(Math.random() * -30);
                drop.speed = 0.5 + Math.random() * 1.2;
                // Rotar caracteres
                drop.chars = drop.chars.map(() => katakana.charAt(Math.floor(Math.random() * katakana.length)));
            }
        });

        // Efecto de glitch ocasional
        if (Math.random() < 0.002) {
            const glitchY = Math.random() * canvas.height * 0.7;
            const glitchH = 15 + Math.random() * 25;
            const offset = (Math.random() - 0.5) * 15;

            try {
                const imageData = ctx.getImageData(0, glitchY, canvas.width, glitchH);
                ctx.putImageData(imageData, offset, glitchY);
            } catch { /* ignore */ }

            ctx.fillStyle = "rgba(0, 255, 65, 0.08)";
            ctx.fillRect(0, glitchY, canvas.width, glitchH);
        }

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
