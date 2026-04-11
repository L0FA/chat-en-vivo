import { useState, useEffect, useRef, useCallback } from "react";

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const SPOTIFY_REGEX = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;

function extractYouTubeId(url) {
    const match = url.match(YOUTUBE_REGEX);
    return match ? match[1] : null;
}

function extractSpotifyInfo(url) {
    const match = url.match(SPOTIFY_REGEX);
    return match ? { type: match[1], id: match[2] } : null;
}

function detectPlatform(url) {
    if (YOUTUBE_REGEX.test(url)) return "youtube";
    if (SPOTIFY_REGEX.test(url)) return "spotify";
    return "unknown";
}

function loadYouTubeAPI() {
    if (window.YT || document.getElementById("yt-api-script")) return;
    const tag = document.createElement("script");
    tag.id = "yt-api-script";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
}

export default function MusicPanel({ socket, open, onClose }) {
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");

    const handleShare = useCallback(() => {
        if (!url.trim() || !socket) return;
        const platform = detectPlatform(url);
        if (platform === "unknown") {
            alert("Ingresá un link válido de YouTube o Spotify");
            return;
        }
        socket.emit("Música Compartida", {
            url,
            title: title || url,
            platform,
            action: "play",
            timestamp: Date.now()
        });
        setUrl("");
        setTitle("");
        onClose();
    }, [url, title, socket, onClose]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute bottom-12 right-0 bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 w-72 shadow-2xl z-50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-sm">🎵 Música juntos</span>
                    <button onClick={onClose} className="text-white hover:scale-110 transition">✖</button>
                </div>
                <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="Link de YouTube o Spotify..."
                    className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-400 placeholder-gray-500"
                />
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Nombre de la canción (opcional)"
                    className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-400 placeholder-gray-500"
                />
                <button
                    onClick={handleShare}
                    className="w-full bg-linear-to-r from-pink-400 to-purple-500 text-white font-bold py-2 rounded-xl hover:opacity-90 transition"
                >
                    ▶ Compartir y reproducir
                </button>
            </div>
        </>
    );
}

// Reproductor YouTube flotante
export function YouTubePlayer({ videoId, title, onClose, socket }) {
    const playerRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const isSyncing = useRef(false);

    useEffect(() => {
        loadYouTubeAPI();
    }, []);

    useEffect(() => {
        if (!videoId) return;

        const initPlayer = () => {
            if (ytPlayerRef.current) {
                ytPlayerRef.current.loadVideoById(videoId);
                return;
            }
            ytPlayerRef.current = new window.YT.Player(playerRef.current, {
                height: "169",
                width: "100%",
                videoId,
                playerVars: { autoplay: 1, controls: 1, modestbranding: 1 },
                events: {
                    onStateChange: (e) => {
                        if (isSyncing.current) return;
                        const isPlaying = e.data === window.YT.PlayerState.PLAYING;
                        const isPaused = e.data === window.YT.PlayerState.PAUSED;
                        if ((isPlaying || isPaused) && socket) {
                            socket.emit("Sincronizar Música", {
                                currentTime: ytPlayerRef.current.getCurrentTime(),
                                isPlaying
                            });
                        }
                    }
                }
            });
        };

        if (window.YT?.Player) {
            initPlayer();
        } else {
            window.onYouTubeIframeAPIReady = initPlayer;
        }
    }, [videoId, socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on("Música Sincronizada", ({ currentTime, isPlaying }) => {
            const player = ytPlayerRef.current;
            if (!player) return;
            isSyncing.current = true;
            const playerTime = player.getCurrentTime();
            if (Math.abs(playerTime - currentTime) > 2) {
                player.seekTo(currentTime, true);
            }
            if (isPlaying) player.playVideo();
            else player.pauseVideo();
            setTimeout(() => { isSyncing.current = false; }, 1000);
        });

        return () => socket.off("Música Sincronizada");
    }, [socket]);

    return (
        <div className="fixed bottom-20 left-4 bg-[#1a1a2e] border border-white/15 rounded-2xl overflow-hidden w-72 shadow-2xl z-200">
            <div className="flex justify-between items-center px-3 py-2 bg-black/40">
                <span className="text-white text-xs font-bold truncate max-w-50">🎵 {title}</span>
                <button onClick={onClose} className="text-white hover:scale-110 transition text-sm">✖</button>
            </div>
            <div ref={playerRef} />
            <div className="flex gap-2 justify-center p-2 bg-black/30">
                <button
                    onClick={() => ytPlayerRef.current?.playVideo()}
                    className="bg-pink-400 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-pink-500 transition"
                >
                    ▶ Play
                </button>
                <button
                    onClick={() => ytPlayerRef.current?.pauseVideo()}
                    className="bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700 transition"
                >
                    ⏸ Pause
                </button>
            </div>
        </div>
    );
}

// Card de música en el chat
export function MusicCard({ message, onPlayHere }) {
    const { url, title, platform } = message.musicData || {};
    if (!url) return null;

    const videoId = platform === "youtube" ? extractYouTubeId(url) : null;
    const spotifyInfo = platform === "spotify" ? extractSpotifyInfo(url) : null;
    const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
    const embedUrl = spotifyInfo ? `https://open.spotify.com/embed/${spotifyInfo.type}/${spotifyInfo.id}` : null;

    return (
        <div className="rounded-xl overflow-hidden border border-black/10 max-w-65 bg-white/60">
            {thumb && (
                <img src={thumb} className="w-full max-h-32 object-cover" alt="thumbnail"/>
            )}
            <div className="p-3 flex flex-col gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
                    platform === "youtube" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                }`}>
                    {platform === "youtube" ? "▶ YouTube" : "🟢 Spotify"}
                </span>
                <span className="font-bold text-sm truncate">{title}</span>
                {embedUrl && (
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="encrypted-media"
                        className="rounded-lg"
                    />
                )}
                <div className="flex gap-2 flex-wrap items-center">
                
                <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline"
                >
                Abrir 🔗
                </a>
                    {videoId && (
                        <button
                            onClick={() => onPlayHere(videoId, title)}
                            className="text-xs bg-pink-400 text-white px-2 py-0.5 rounded-lg hover:bg-pink-500 transition"
                        >
                            ▶ Reproducir aquí
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}