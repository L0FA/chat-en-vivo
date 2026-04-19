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
    default: createDefaultAnimation
};

export default function ThemeBackground() {
    const { theme } = useChat();
    const canvasRef = useRef(null);
    const themeRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        const stopCurrentAnimation = () => {
            if (animationRef.current) {
                animationRef.current.stop();
                animationRef.current = null;
            }
        };

        const handleResize = () => {
            stopCurrentAnimation();
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const currentTheme = themeRef.current;
            if (!currentTheme) return;
            
            const themeKey = currentTheme === "default" || currentTheme === "custom" ? "minimal" : currentTheme;
            const createAnimation = THEME_ANIMATIONS[themeKey] || createDefaultAnimation;
            animationRef.current = createAnimation(ctx, canvas);
        };
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        window.addEventListener("resize", handleResize);

        themeRef.current = theme;
        const themeKey = theme === "default" || theme === "custom" ? "minimal" : theme;
        const createAnimation = THEME_ANIMATIONS[themeKey] || createDefaultAnimation;
        
        const animResult = createAnimation(ctx, canvas);
        
        if (animResult && typeof animResult === "object") {
            animationRef.current = animResult;
        }

        return () => {
            stopCurrentAnimation();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            window.removeEventListener("resize", handleResize);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ opacity: 1, zIndex: -10 }}
        />
    );
}