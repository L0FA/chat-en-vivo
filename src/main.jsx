import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChatProvider } from "./context/ChatProvider";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ChatProvider>
            <App />
        </ChatProvider>
    </StrictMode>
);