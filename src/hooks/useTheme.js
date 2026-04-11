import { useEffect } from "react";
import { useChat } from "../hooks/useChat";

const THEMES = [
    "default", "rosa", "dark", "darkpink", "neon",
    "cyberpunk", "matrix", "retro", "ocean", "forest",
    "galaxy", "minimal", "vaporwave", "fire"
];

export function useTheme() {
    const { theme, changeTheme } = useChat();

    useEffect(() => {
        // Limpiar clases anteriores
        THEMES.filter(t => t !== "default").forEach(t => {
            document.documentElement.classList.remove(`theme-${t}`);
        });

        if (theme !== "default") {
            document.documentElement.classList.add(`theme-${theme}`);
        }
    }, [theme]);

    return { theme, changeTheme, THEMES };
}