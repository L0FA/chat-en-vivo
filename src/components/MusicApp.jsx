import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const SOUNDCLOUD_REGEX = /(?:soundcloud\.com\/[\w-]+\/[\w-]+)/;
const SPOTIFY_REGEX = /(?:open\.spotify\.com\/track\/[\w]+)/;

function extractYouTubeId(url) {
    const match = url.match(YOUTUBE_REGEX);
    return match ? match[1] : null;
}

function getAudioType(url) {
    if (!url) return null;
    if (YOUTUBE_REGEX.test(url)) return "youtube";
    if (SOUNDCLOUD_REGEX.test(url)) return "soundcloud";
    if (SPOTIFY_REGEX.test(url)) return "spotify";
    if (url.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) return "audio";
    if (url.startsWith("data:")) return "audio";
    return "url";
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicApp({ socket, currentUser, open, onClose }) {
    const [canciones, setCanciones] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [uploading, setUploading] = useState(false);
const [tab, setTab] = useState("cola");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [equilizer, setEquilizer] = useState(false);
    
    const [titulo, setTitulo] = useState("");
    const [artista, setArtista] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [portadaFile, setPortadaFile] = useState(null);
    const [portadaPreview, setPortadaPreview] = useState(null);
    const [urlStream, setUrlStream] = useState("");

    const [show, setShow] = useState(false);

    const audioRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const ytContainerRef = useRef(null);
    const progressRef = useRef(null);
    const isSyncing = useRef(false);
    const fileInputRef = useRef(null);
    const portadaInputRef = useRef(null);

    const cancionActual = canciones[currentIndex];

    // ---- Socket events ----
    useEffect(() => {
        if (!socket) return;

        socket.on("Canción Agregada", (cancion) => {
            setCanciones(prev => {
                if (prev.find(c => c.id === cancion.id)) return prev;
                return [...prev, cancion];
            });
        });

        socket.on("Canción Eliminada", ({ cancionId }) => {
            setCanciones(prev => prev.filter(c => c.id !== cancionId));
        });

        socket.on("Sync Música App", ({ accion, cancionId, currentTime: ct }) => {
            if (isSyncing.current) return;
            isSyncing.current = true;

            if (accion === "play") {
                setCanciones(prev => {
                    const idx = prev.findIndex(c => c.id === cancionId);
                    if (idx !== -1) setCurrentIndex(idx);
                    return prev;
                });
                setIsPlaying(true);
                if (audioRef.current) {
                    if (ct) audioRef.current.currentTime = ct;
                    audioRef.current.play();
                }
                if (ytPlayerRef.current) {
                    if (ct) ytPlayerRef.current.seekTo(ct, true);
                    ytPlayerRef.current.playVideo();
                }
            } else if (accion === "pause") {
                setIsPlaying(false);
                audioRef.current?.pause();
                ytPlayerRef.current?.pauseVideo();
            } else if (accion === "seek") {
                if (audioRef.current) audioRef.current.currentTime = ct;
                if (ytPlayerRef.current) ytPlayerRef.current.seekTo(ct, true);
            } else if (accion === "next") {
                setCurrentIndex(prev => (prev + 1) % canciones.length);
                setIsPlaying(true);
            } else if (accion === "prev") {
                setCurrentIndex(prev => prev === 0 ? canciones.length - 1 : prev - 1);
                setIsPlaying(true);
            }

            setTimeout(() => { isSyncing.current = false; }, 500);
        });

        return () => {
            socket.off("Canción Agregada");
            socket.off("Canción Eliminada");
            socket.off("Sync Música App");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket]);

    // ---- YouTube Player ----
    useEffect(() => {
        if (!cancionActual || cancionActual.tipo !== "youtube") return;
        const videoId = extractYouTubeId(cancionActual.contenido);
        if (!videoId) return;

        const initYT = () => {
            if (ytPlayerRef.current) {
                ytPlayerRef.current.loadVideoById(videoId);
                return;
            }
            if (!ytContainerRef.current) return;
            ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
                height: "1",
                width: "1",
                videoId,
                playerVars: { 
                    autoplay: 0,
                    playsinline: 1,
                    enablejsapi: 1
                },
                events: {
                    onReady: () => {
                        ytPlayerRef.current.setVolume(volume * 100);
                        if (isPlaying) ytPlayerRef.current.playVideo();
                    },
                    onStateChange: (e) => {
                        if (e.data === window.YT.PlayerState.ENDED) handleEnded();
                    }
                }
            });
        };

        if (!document.getElementById("yt-api-script")) {
            const tag = document.createElement("script");
            tag.id = "yt-api-script";
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
            window.onYouTubeIframeAPIReady = initYT;
        } else if (window.YT?.Player) {
            initYT();
        } else {
            window.onYouTubeIframeAPIReady = initYT;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cancionActual]);

    // ---- Audio tipo URL/Stream ----
    useEffect(() => {
        if (!cancionActual || (cancionActual.tipo !== "url" && cancionActual.tipo !== "soundcloud" && cancionActual.tipo !== "spotify")) return;
        if (audioRef.current && cancionActual.tipo === "url") {
            audioRef.current.src = cancionActual.contenido;
            audioRef.current.volume = volume;
            audioRef.current.load();
            if (isPlaying) audioRef.current.play().catch(console.error);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cancionActual]);

    // ---- Búsqueda YouTube ----
    const searchYouTube = async (query) => {
        if (!query.trim()) return;
        setSearching(true);
        try {
            const apiBase = import.meta.env.VITE_SOCKET_URL || window.location.origin;
            const res = await fetch(`${apiBase}/api/youtube/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data.items || []);
        } catch (err) {
            console.error("Error buscar YouTube:", err);
        } finally {
            setSearching(false);
        }
    };

    const addFromSearch = (video) => {
        const videoId = video.id?.videoId || video.id;
        const title = video.snippet?.title || "Video";
        socket?.emit("Subir Canción", {
            titulo: title,
            artista: video.snippet?.channelTitle || "YouTube",
            tipo: "youtube",
            contenido: `https://www.youtube.com/watch?v=${videoId}`,
            portada: video.snippet?.thumbnails?.medium?.url
        }, (response) => {
            if (response?.status !== "ok") console.error("Error al agregar");
        });
    };

    // ---- Progreso audio ----
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const update = () => {
            setCurrentTime(audio.currentTime);
            setDuration(audio.duration || 0);
        };
        const onEnded = () => handleEnded();
        audio.addEventListener("timeupdate", update);
        audio.addEventListener("loadedmetadata", update);
        audio.addEventListener("ended", onEnded);
        return () => {
            audio.removeEventListener("timeupdate", update);
            audio.removeEventListener("loadedmetadata", update);
            audio.removeEventListener("ended", onEnded);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- Progreso YouTube ----
    useEffect(() => {
        if (!cancionActual || cancionActual.tipo !== "youtube") return;
        const interval = setInterval(() => {
            if (ytPlayerRef.current?.getCurrentTime) {
                setCurrentTime(ytPlayerRef.current.getCurrentTime());
                setDuration(ytPlayerRef.current.getDuration() || 0);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [cancionActual]);

    // ---- Cargar audio cuando cambia canción ----
    useEffect(() => {
        if (!cancionActual || cancionActual.tipo !== "audio") return;
        if (audioRef.current) {
            audioRef.current.src = cancionActual.contenido;
            audioRef.current.volume = volume;
            audioRef.current.load();
            if (isPlaying) audioRef.current.play().catch(console.error);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cancionActual]);

    // ---- Controles ----
    const emitSync = useCallback((accion, extra = {}) => {
        if (!socket || isSyncing.current) return;
        socket.emit("Sync Música App", {
            accion,
            cancionId: cancionActual?.id,
            currentTime: audioRef.current?.currentTime || ytPlayerRef.current?.getCurrentTime?.() || 0,
            ...extra
        });
    }, [socket, cancionActual]);

    const play = useCallback(() => {
        if (!cancionActual) return;
        if (cancionActual.tipo === "audio") {
            audioRef.current?.play().catch(console.error);
        } else {
            ytPlayerRef.current?.playVideo();
        }
        setIsPlaying(true);
        emitSync("play");
    }, [cancionActual, emitSync]);

    const pause = useCallback(() => {
        audioRef.current?.pause();
        ytPlayerRef.current?.pauseVideo();
        setIsPlaying(false);
        emitSync("pause");
    }, [emitSync]);

    const handleEnded = useCallback(() => {
        if (repeat) {
            if (cancionActual?.tipo === "audio" && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            } else {
                ytPlayerRef.current?.seekTo(0, true);
                ytPlayerRef.current?.playVideo();
            }
        } else {
            setCurrentIndex(prev => {
                const next = shuffle
                    ? Math.floor(Math.random() * canciones.length)
                    : (prev + 1) % canciones.length;
                return next;
            });
            setIsPlaying(true);
        }
    }, [repeat, shuffle, canciones.length, cancionActual]);

    const playNext = useCallback(() => {
        if (!canciones.length) return;
        setCurrentIndex(prev => {
            const next = shuffle
                ? Math.floor(Math.random() * canciones.length)
                : (prev + 1) % canciones.length;
            return next;
        });
        setIsPlaying(true);
        emitSync("next");
    }, [canciones.length, shuffle, emitSync]);

    const playPrev = useCallback(() => {
        if (!canciones.length) return;
        setCurrentIndex(prev => prev === 0 ? canciones.length - 1 : prev - 1);
        setIsPlaying(true);
        emitSync("prev");
    }, [canciones.length, emitSync]);

    const handleSeek = useCallback((e) => {
        const rect = progressRef.current?.getBoundingClientRect();
        if (!rect || !duration) return;
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = pct * duration;
        if (audioRef.current) audioRef.current.currentTime = time;
        if (ytPlayerRef.current) ytPlayerRef.current.seekTo(time, true);
        setCurrentTime(time);
        emitSync("seek", { currentTime: time });
    }, [duration, emitSync]);

    const handleVolume = useCallback((e) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
        if (ytPlayerRef.current) ytPlayerRef.current.setVolume(v * 100);
    }, []);

    const playCancion = useCallback((idx) => {
        const c = canciones[idx];
        if (!c) return;
        setCurrentIndex(idx);
        setIsPlaying(true);
        if (c.tipo === "audio" && audioRef.current) {
            audioRef.current.src = c.contenido;
            audioRef.current.load();
            audioRef.current.play().catch(console.error);
        }
        socket?.emit("Sync Música App", { accion: "play", cancionId: c.id, currentTime: 0 });
    }, [canciones, socket]);

    const handleEliminar = useCallback((cancionId) => {
        socket?.emit("Eliminar Canción", { cancionId });
    }, [socket]);

    // ---- Portada ----
    const handlePortadaChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setPortadaPreview(ev.target.result);
        reader.readAsDataURL(file);
        setPortadaFile(file);
    };

    // ---- Subir canción ----
    const handleSubir = useCallback(async () => {
        if (!titulo.trim()) { alert("Ingresá un título"); return; }
        if (!audioFile && !youtubeUrl.trim() && !urlStream.trim()) { alert("Subí un archivo, link de YouTube, o URL de audio"); return; }
        if (audioFile && audioFile.size > 50 * 1024 * 1024) {
            alert("El archivo no puede superar los 50MB");
            return;
        }

        setUploading(true);
        try {
            let contenido = "";
            let tipo = "";

            if (youtubeUrl.trim()) {
                const videoId = extractYouTubeId(youtubeUrl);
                if (!videoId) { alert("Link de YouTube inválido"); setUploading(false); return; }
                contenido = youtubeUrl.trim();
                tipo = "youtube";
            } else if (urlStream.trim()) {
                contenido = urlStream.trim();
                tipo = getAudioType(contenido) || "url";
            } else {
                const reader = new FileReader();
                contenido = await new Promise((res, rej) => {
                    reader.onload = (e) => res(e.target.result);
                    reader.onerror = rej;
                    reader.readAsDataURL(audioFile);
                });
                tipo = "audio";
            }

            let portadaData = null;
            if (portadaFile) {
                const reader = new FileReader();
                portadaData = await new Promise((res) => {
                    reader.onload = (e) => res(e.target.result);
                    reader.readAsDataURL(portadaFile);
                });
            }

            socket?.emit("Subir Canción", {
                titulo: titulo.trim(),
                artista: artista.trim() || "Desconocido",
                tipo,
                contenido,
                portada: portadaData
            }, (response) => {
                if (response?.status !== "ok") alert("Error al subir la canción");
            });

            setTitulo("");
            setArtista("");
            setYoutubeUrl("");
            setUrlStream("");
            setAudioFile(null);
            setPortadaFile(null);
            setPortadaPreview(null);
            setSearchResults([]);
            setTab("cola");
        } catch (err) {
            console.error("Error subiendo canción:", err);
            alert("Error al procesar el archivo");
        } finally {
            setUploading(false);
        }
    }, [titulo, artista, youtubeUrl, urlStream, audioFile, portadaFile, socket]);

    // Animación de fade
    useEffect(() => {
        if (open) {
            setShow(true);
        } else {
            const timer = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    if (!show) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return createPortal(
        <>
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} style={{ zIndex: 9998 }} onClick={onClose} />
            <div
                style={{ zIndex: 9999 }}
                className={`fixed bottom-20 right-4 w-80 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl border border-white/10 transition-all duration-300 ${
                    open 
                        ? "opacity-100 translate-y-0 scale-100" 
                        : "opacity-0 translate-y-4 scale-95"
                }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Fondo con gradiente glass */}
                <div className="absolute inset-0 bg-linear-to-b from-white/5 via-white/3 to-black/20 pointer-events-none rounded-3xl" />
                
                {/* Header */}
                <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-white font-bold text-sm">🎵 Música</span>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition cursor-pointer">✖</button>
                </div>

                {/* Portada + info */}
                <div className="px-4 pt-4 pb-2 flex flex-col items-center gap-3">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center shadow-xl">
                        {cancionActual?.portada ? (
                            <img src={cancionActual.portada} className="w-full h-full object-cover" alt="portada"/>
                        ) : cancionActual?.tipo === "youtube" ? (
                            <img
                                src={`https://img.youtube.com/vi/${extractYouTubeId(cancionActual.contenido)}/mqdefault.jpg`}
                                className="w-full h-full object-cover"
                                alt="portada"
                            />
                        ) : (
                            <span className="text-5xl">🎵</span>
                        )}
                    </div>
                    <div className="text-center">
                        <p className="text-white font-bold text-sm truncate max-w-60">
                            {cancionActual?.titulo || "Sin canción"}
                        </p>
                        <p className="text-white/50 text-xs">
                            {cancionActual?.artista || "—"}
                        </p>
                    </div>
                </div>

                {/* Barra de progreso */}
                <div className="px-4">
                    <div
                        ref={progressRef}
                        onClick={handleSeek}
                        className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer"
                    >
                        <div
                            className="h-full bg-pink-400 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controles */}
                <div className="flex items-center justify-center gap-4 px-4 py-3">
                    <button
                        onClick={() => setShuffle(s => !s)}
                        className={`text-lg cursor-pointer transition ${shuffle ? "text-pink-400" : "text-white/30 hover:text-white"}`}
                    >🔀</button>
                    <button onClick={playPrev} className="text-white hover:text-pink-400 transition cursor-pointer text-xl">⏮</button>
                    <button
                        onClick={isPlaying ? pause : play}
                        className="w-12 h-12 rounded-full bg-pink-400 hover:bg-pink-500 flex items-center justify-center text-white text-xl shadow-lg transition cursor-pointer"
                    >
                        {isPlaying ? "⏸" : "▶"}
                    </button>
                    <button onClick={playNext} className="text-white hover:text-pink-400 transition cursor-pointer text-xl">⏭</button>
                    <button
                        onClick={() => setRepeat(r => !r)}
                        className={`text-lg cursor-pointer transition ${repeat ? "text-pink-400" : "text-white/30 hover:text-white"}`}
                    >🔁</button>
                </div>

                {/* Volumen */}
                <div className="flex items-center gap-2 px-4 pb-3">
                    <span className="text-white/40 text-xs">🔈</span>
                    <input
                        type="range" min="0" max="1" step="0.01"
                        value={volume} onChange={handleVolume}
                        className="flex-1 accent-pink-400 cursor-pointer"
                    />
                    <span className="text-white/40 text-xs">🔊</span>
                </div>

                {/* Tabs */}
                <div className="flex border-t border-white/10">
                    {[
                        { id: "cola", label: "📋" }, 
                        { id: "subir", label: "➕" },
                        { id: "buscar", label: "🔍" },
                        { id: "eq", label: "🎚️" }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 py-2 text-xs font-bold transition cursor-pointer ${
                                tab === t.id ? "text-pink-400 border-b-2 border-pink-400" : "text-white/40 hover:text-white"
                            }`}
                            title={t.label}
                        >{t.label}</button>
                    ))}
                </div>

                {/* Tab Cola */}
                {tab === "cola" && (
                    <div className="max-h-48 overflow-y-auto">
                        {canciones.length === 0 && (
                            <p className="text-white/30 text-xs text-center py-6">No hay canciones aún</p>
                        )}
                        {canciones.map((c, i) => (
                            <div
                                key={c.id}
                                className={`flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition cursor-pointer ${i === currentIndex ? "bg-white/10" : ""}`}
                                onClick={() => playCancion(i)}
                            >
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                                    {c.portada ? (
                                        <img src={c.portada} className="w-full h-full object-cover" alt=""/>
                                    ) : c.tipo === "youtube" ? (
                                        <img src={`https://img.youtube.com/vi/${extractYouTubeId(c.contenido)}/default.jpg`} className="w-full h-full object-cover" alt=""/>
                                    ) : (
                                        <span className="text-sm">🎵</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold truncate ${i === currentIndex ? "text-pink-400" : "text-white"}`}>
                                        {c.titulo}
                                    </p>
                                    <p className="text-white/40 text-xs truncate">{c.artista}</p>
                                </div>
                                {c.usuario === currentUser && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEliminar(c.id); }}
                                        className="text-white/20 hover:text-red-400 transition text-xs cursor-pointer"
                                    >🗑️</button>
                                )}
                                {i === currentIndex && isPlaying && (
                                    <span className="text-pink-400 text-xs animate-pulse">▶</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab Subir */}
                {tab === "subir" && (
                    <div className="p-4 flex flex-col gap-3 max-h-64 overflow-y-auto">
                        <div
                            onClick={() => portadaInputRef.current?.click()}
                            className="w-full h-24 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-pink-400 transition overflow-hidden"
                        >
                            {portadaPreview ? (
                                <img src={portadaPreview} className="w-full h-full object-cover" alt="portada"/>
                            ) : (
                                <span className="text-white/30 text-xs">🖼️ Subir portada (opcional)</span>
                            )}
                        </div>
                        <input ref={portadaInputRef} type="file" accept="image/*" className="hidden" onChange={handlePortadaChange}/>
                        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título *"
                            className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-400 placeholder-white/30"/>
                        <input type="text" value={artista} onChange={e => setArtista(e.target.value)} placeholder="Artista"
                            className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-400 placeholder-white/30"/>
                        <input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Link de YouTube"
                            className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-400 placeholder-white/30"/>
                        <input type="text" value={urlStream} onChange={e => setUrlStream(e.target.value)} placeholder="URL de audio (MP3, Stream)"
                            className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-400 placeholder-white/30"/>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-white/10"/>
                            <span className="text-white/30 text-xs">o</span>
                            <div className="flex-1 h-px bg-white/10"/>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-white/10 hover:bg-white/20 text-white/70 text-xs py-2 rounded-lg transition cursor-pointer">
                            {audioFile ? `✅ ${audioFile.name}` : "🎵 Subir archivo MP3/WAV"}
                        </button>
                        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files?.[0])}/>
                        <button onClick={handleSubir} disabled={uploading}
                            className="w-full bg-pink-400 hover:bg-pink-500 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50">
                            {uploading ? "Subiendo..." : "▶ Agregar a la cola"}
                        </button>
                    </div>
                )}

                {/* Tab Buscar */}
                {tab === "buscar" && (
                    <div className="flex flex-col max-h-64">
                        <div className="p-3 border-b border-white/10">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && searchYouTube(searchQuery)}
                                    placeholder="Buscar en YouTube..."
                                    className="flex-1 bg-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-400 placeholder-white/30"
                                />
                                <button
                                    onClick={() => searchYouTube(searchQuery)}
                                    disabled={searching}
                                    className="bg-pink-400 text-white text-xs px-3 py-2 rounded-lg hover:bg-pink-500 transition disabled:opacity-50"
                                >
                                    {searching ? "..." : "🔍"}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {searchResults.length === 0 && (
                                <p className="text-white/30 text-xs text-center py-6">
                                    Busca canciones en YouTube
                                </p>
                            )}
                            {searchResults.map((video) => {
                                const videoId = video.id?.videoId || video.id;
                                const title = video.snippet?.title || "";
                                if (!videoId) return null;
                                return (
                                    <div
                                        key={video.id}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition cursor-pointer"
                                        onClick={() => addFromSearch(video)}
                                    >
                                        <div className="w-12 h-12 rounded overflow-hidden bg-white/5 shrink-0">
                                            <img 
                                                src={video.snippet?.thumbnails?.default?.url} 
                                                className="w-full h-full object-cover"
                                                alt=""
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white truncate">{title}</p>
                                            <p className="text-white/40 text-xs truncate">{video.snippet?.channelTitle}</p>
                                        </div>
                                        <span className="text-green-400 text-lg">➕</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab EQ */}
                {tab === "eq" && (
                    <div className="p-4 flex flex-col gap-4 max-h-64 overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <span className="text-white text-xs">🎚️ Ecualizador</span>
                            <button
                                onClick={() => setEquilizer(e => !e)}
                                className={`text-xs px-2 py-1 rounded ${equilizer ? "bg-pink-400 text-white" : "bg-white/10 text-white/50"}`}
                            >
                                {equilizer ? "ON" : "OFF"}
                            </button>
                        </div>
                        
                        {equilizer && (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/50 text-xs w-8">Bass</span>
                                        <input 
                                            type="range" min="0" max="100" defaultValue="50"
                                            className="flex-1 accent-pink-400 h-1.5"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/50 text-xs w-8">Mid</span>
                                        <input 
                                            type="range" min="0" max="100" defaultValue="50"
                                            className="flex-1 accent-pink-400 h-1.5"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/50 text-xs w-8">Treble</span>
                                        <input 
                                            type="range" min="0" max="100" defaultValue="50"
                                            className="flex-1 accent-pink-400 h-1.5"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/50 text-xs w-8">Reverb</span>
                                        <input 
                                            type="range" min="0" max="100" defaultValue="30"
                                            className="flex-1 accent-pink-400 h-1.5"
                                        />
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    <span className="text-white/40 text-xs">Presets</span>
                                    <div className="flex gap-2 mt-2 flex-wrap justify-center">
                                        {["Flat", "Rock", "Pop", "Jazz", "Classical", "Hip-Hop"].map(preset => (
                                            <button
                                                key={preset}
                                                className="text-xs bg-white/10 hover:bg-pink-400/30 text-white/70 px-3 py-1.5 rounded-full transition"
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {!equilizer && (
                            <p className="text-white/30 text-xs text-center py-4">
                                Activa el ecualizador para mejorar el sonido
                            </p>
                        )}
                    </div>
                )}

                <div ref={ytContainerRef} style={{ width: 1, height: 1, overflow: "hidden" }}/>
                <audio ref={audioRef} style={{ display: "none" }}/>
            </div>
        </>,
        document.body
    );
}