import { useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";

const THEMES = [
    "default", "rosa", "dark", "darkpink", "neon",
    "cyberpunk", "matrix", "retro", "ocean", "forest",
    "galaxy", "vaporwave", "fire", "custom"
];

export function useTheme() {
    const { theme, changeTheme } = useChat();
    const [customTheme, setCustomThemeState] = useState(() => {
        const saved = localStorage.getItem("chat-custom-theme");
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        THEMES.filter(t => t !== "default" && t !== "custom").forEach(t => {
            document.documentElement.classList.remove(`theme-${t}`);
        });

        if (theme !== "default" && theme !== "custom") {
            document.documentElement.classList.add(`theme-${theme}`);
        }

        if (theme === "custom" && customTheme) {
            document.documentElement.style.setProperty("--custom-bg", customTheme.bg);
            document.documentElement.style.setProperty("--custom-text", customTheme.text);
        }
    }, [theme, customTheme]);

    const setCustomTheme = (data) => {
        setCustomThemeState(data);
        localStorage.setItem("chat-custom-theme", JSON.stringify(data));
    };

    return { theme, changeTheme, THEMES, customTheme, setCustomTheme };
}