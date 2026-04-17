// ============================================
// 🎨 THEME BACKGROUND - Canvas animado por tema
// ============================================

import { useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";

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

const activeAnimations = new WeakMap();

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
    minimal: createMinimalAnimation,
    default: createDefaultAnimation
};

export default function ThemeBackground() {
    const { theme } = useChat();
    const canvasRef = useRef(null);
    const themeRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const currentTheme = theme;
        themeRef.current = currentTheme;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        handleResize();
        window.addEventListener("resize", handleResize);

        const themeKey = currentTheme === "default" || currentTheme === "custom" ? "minimal" : currentTheme;
        const createAnimation = THEME_ANIMATIONS[themeKey] || createDefaultAnimation;
        
        const animResult = createAnimation(ctx, canvas);
        
        if (animResult && typeof animResult === "object") {
            activeAnimations.set(canvas, animResult);
        }

        return () => {
            const storedAnim = activeAnimations.get(canvas);
            if (storedAnim && storedAnim.stop) {
                storedAnim.stop();
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            window.removeEventListener("resize", handleResize);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ opacity: 0.5, zIndex: -10 }}
        />
    );
}