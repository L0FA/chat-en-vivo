import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChat debe usarse dentro de ChatProvider");
    return ctx;
}