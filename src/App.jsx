import { useChat } from "./hooks/useChat";
import { useTheme } from "./hooks/useTheme";
import Login from "./components/Login";
import Chat from "./components/Chat";
import ThemeBackground from "./components/ThemeBackground";

export default function App() {
    const { user } = useChat();
    useTheme();

    return (
        <div className="w-full flex flex-col" style={{ height: "100dvh" }}>
            <ThemeBackground />
            {!user ? <Login /> : <Chat />}
        </div>
    );
}