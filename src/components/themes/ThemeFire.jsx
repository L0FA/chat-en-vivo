// ============================================
// 🔥 TEMA FIRE - Simulación de Mapa de Calor (Heatmap)
// ============================================

export function createFireAnimation(ctx, canvas) {
    let animId = null;
    let stopped = false;

    // Configuración de la simulación (resolución reducida para rendimiento y suavidad)
    const w = 150; 
    const h = 140; // Más alto = llamas más altas
    const size = w * h;
    const pixels = new Uint8Array(size); // Almacena el "calor" de cada píxel

    // Paleta de colores (Reds & Oranges)
    const palette = new Uint8ClampedArray(256 * 4);
    for (let i = 0; i < 256; i++) {
        // Paleta más tenue: Negro -> Rojo Oscuro -> Rojo Medio
        palette[i * 4] = Math.min(200, i * 1.6); // Rojo más apagado
        palette[i * 4 + 1] = Math.max(0, i - 170) * 1.0; // Casi sin amarillo
        palette[i * 4 + 2] = Math.max(0, i - 230) * 2; 
        palette[i * 4 + 3] = i > 12 ? Math.min(220, i * 1.2) : 0; // Alpha más bajo
    }

    // Canvas auxiliar para la simulación
    const fireCanvas = document.createElement("canvas");
    fireCanvas.width = w;
    fireCanvas.height = h;
    const fCtx = fireCanvas.getContext("2d");
    const fireData = fCtx.createImageData(w, h);

    const updateFire = () => {
        // 1. Inyectar calor en la base (fuego nuevo - MENOS INTENSO)
        for (let x = 0; x < w; x++) {
            if (Math.random() > 0.15) { // Menos frecuencia de inyección
                pixels[(h - 1) * w + x] = 255;
            } else {
                pixels[(h - 1) * w + x] = Math.max(0, pixels[(h - 1) * w + x] - 50);
            }
        }

        // 2. Propagación del calor hacia arriba
        for (let y = 0; y < h - 1; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                const below = ((y + 1) * w + x);
                const belowLeft = ((y + 1) * w + (x - 1 + w) % w);
                const belowRight = ((y + 1) * w + (x + 1) % w);
                
                // Enfriamiento reducido = llamas más altas
                const cooling = 1.8 + Math.random() * 1.2; 
                const newHeat = (pixels[below] + pixels[belowLeft] + pixels[belowRight] + pixels[(y + 2 < h ? y + 2 : y + 1) * w + x]) / 4.1 - cooling;
                
                pixels[i] = Math.max(0, newHeat);
            }
        }
    };

    const drawFire = () => {
        // Convertir calor en colores usando la paleta
        for (let i = 0; i < size; i++) {
            const heat = pixels[i];
            const pIdx = heat * 4;
            const dIdx = i * 4;
            fireData.data[dIdx] = palette[pIdx];
            fireData.data[dIdx + 1] = palette[pIdx + 1];
            fireData.data[dIdx + 2] = palette[pIdx + 2];
            fireData.data[dIdx + 3] = palette[pIdx + 3];
        }
        fCtx.putImageData(fireData, 0, 0);
    };

    const animate = () => {
        if (stopped) return;

        updateFire();
        drawFire();

        // Limpiar main canvas
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar la simulación escalada (Smoothing habilitado para realismo fluido)
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        
        // Dibujamos el canvas de fuego estirado para cubrir el ancho
        // Lo dibujamos un poco más abajo para que la base caliente esté fuera de vista o justo en el borde
        const scaleX = canvas.width / w;
        const scaleY = canvas.height / h;
        ctx.drawImage(fireCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
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