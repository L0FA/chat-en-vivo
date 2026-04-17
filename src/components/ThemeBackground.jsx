// ============================================
// 🎨 THEME BACKGROUND - Canvas animado por tema
// Gestiona el canvas y distribuye a los archivos de temas
// ============================================

import { useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";

// Importaciones de temas individuales
import {
    createRosaAnimation,
    createDarkPinkAnimation,
    createDarkAnimation,
    createMatrixAnimation,
    createNeonAnimation,
    createCyberpunkAnimation,
    createFireAnimation,
    createOceanAnimation,
    createForestAnimation,
    createGalaxyAnimation,
    createVaporwaveAnimation,
    createRetroAnimation,
    createMinimalAnimation,
    createDefaultAnimation
} from "./themes";

/**
 * Mapa de temas a sus funciones de animación
 * Cada tema tiene su propio archivo en /themes/
 */
const THEME_ANIMATIONS = {
    rosa: createRosaAnimation,
    darkpink: createDarkPinkAnimation,
    dark: createDarkAnimation,
    matrix: createMatrixAnimation,
    neon: createNeonAnimation,
    cyberpunk: createCyberpunkAnimation,
    fire: createFireAnimation,
    ocean: createOceanAnimation,
    forest: createForestAnimation,
    galaxy: createGalaxyAnimation,
    vaporwave: createVaporwaveAnimation,
    retro: createRetroAnimation,
    minimal: createMinimalAnimation
};

/**
 * Componente principal del fondo animado
 * Maneja el canvas y selecciona la animación correcta según el tema
 */
export default function ThemeBackground() {
    const { theme } = useChat();
    const canvasRef = useRef(null);
    const runningRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        runningRef.current = true;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        handleResize();
        window.addEventListener("resize", handleResize);

        // Obtener función de animación según el tema
        const themeKey = theme === "default" || theme === "custom" ? "minimal" : theme;
        const createAnimation = THEME_ANIMATIONS[themeKey] || createDefaultAnimation;
        
        // Crear y ejecutar animación
        const animateFn = createAnimation(ctx, canvas);
        
        if (typeof animateFn === "function") {
            animateFn();
        }

        // Cleanup al desmontar o cambiar tema
        return () => {
            runningRef.current = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            window.removeEventListener("resize", handleResize);
        };
    }, [theme]);

    // Renderizado del canvas
    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ opacity: 0.5, zIndex: -10 }}
        />
    );
}