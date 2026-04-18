// ============================================
// 🎵 MUSIC APP - Componente principal de música
// Reproduce música de YouTube, archivos locales, URLs
// Archivo: src/components/MusicApp.jsx
// ============================================

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { formatTime, extractYouTubeId } from "../utils/musicUtils";
import { MusicQueue } from "./music";

export default function MusicApp({ socket, open, onClose }) {
    // ============================================
    // 🔧 ESTADOS
    // ============================================
    
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
    
    const [titulo, setTitulo] = useState("");
    const [artista, setArtista] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [portadaPreview, setPortadaPreview] = useState(null);
    const [urlStream, setUrlStream] = useState("");
    
    const [show, setShow] = useState(false);

    // ============================================
    // 🔗 REFERENCIAS
    // ============================================
    
    const audioRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const ytContainerRef = useRef(null);
    const progressRef = useRef(null);
    const fileInputRef = useRef(null);

    const cancionActual = canciones.length > 0 ? canciones[currentIndex] : null;

    // ============================================
    // 📡 SOCKET SYNC (MÚSICA)
    // ============================================
    
    useEffect(() => {
        if (!socket) return;

        // Pedir lista inicial
        socket.emit("Cargar Cola Música", (res) => {
            if (res?.status === "ok") setCanciones(res.canciones);
        });

        const handleUpdateList = (list) => {
            setCanciones(Array.isArray(list) ? list : []);
        };

        const handleAdd = (cancion) => {
            setCanciones(prev => [...prev, cancion]);
        };

        const handleRemove = ({ cancionId }) => {
            setCanciones(prev => prev.filter(c => c.id !== cancionId));
        };

        const handleSync = ({ accion, currentTime: time, cancionId }) => {
            if (accion === "play") {
                setIsPlaying(true);
                if (cancionId) {
                    const idx = canciones.findIndex(c => c.id === cancionId);
                    if (idx !== -1) setCurrentIndex(idx);
                }
            } else if (accion === "pause") {
                setIsPlaying(false);
            }
        };

        socket.on("Lista Música Actualizada", handleUpdateList);
        socket.on("Canción Agregada", handleAdd);
        socket.on("Canción Eliminada", handleRemove);
        socket.on("Sync Música App", handleSync);

        return () => {
            socket.off("Lista Música Actualizada", handleUpdateList);
            socket.off("Canción Agregada", handleAdd);
            socket.off("Canción Eliminada", handleRemove);
            socket.off("Sync Música App", handleSync);
        };
    }, [socket, canciones.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // ============================================
    // 🎮 CONTROL FUNCTIONS
    // ============================================

    const handleEnded = useCallback(() => {
        if (repeat) {
            if (cancionActual?.tipo === "audio" && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            } else if (ytPlayerRef.current) {
                ytPlayerRef.current.seekTo(0, true);
                ytPlayerRef.current.playVideo();
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

    const emitSync = useCallback((accion, extra = {}) => {
        if (!socket || !cancionActual) return;
        socket.emit("Sync Música App", { 
            accion, 
            cancionId: cancionActual.id, 
            currentTime: currentTime,
            ...extra 
        });
    }, [socket, cancionActual, currentTime]);

    const play = useCallback(() => {
        if (!cancionActual) return;
        if (cancionActual.tipo === "audio" || cancionActual.tipo === "url") {
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

    const handleVolumeChange = useCallback((v) => {
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
        if (ytPlayerRef.current) ytPlayerRef.current.setVolume(v * 100);
    }, []);

    const playPrev = useCallback(() => {
        if (canciones.length === 0) return;
        setCurrentIndex(prev => (prev === 0 ? canciones.length - 1 : prev - 1));
        setIsPlaying(true);
    }, [canciones.length]);

    const playNext = useCallback(() => {
        if (canciones.length === 0) return;
        setCurrentIndex(prev => (prev + 1) % canciones.length);
        setIsPlaying(true);
    }, [canciones.length]);

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

    // ============================================
    // 🔍 SEARCH & UPLOAD
    // ============================================

    const searchYouTube = async (query) => {
        if (!query.trim()) return;
        setSearching(true);
        try {
            const apiBase = import.meta.env.VITE_SOCKET_URL || window.location.origin;
            const res = await fetch(`${apiBase}/api/youtube/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data.items || []);
        } catch (err) {
            console.error("Error search YouTube:", err);
        } finally {
            setSearching(false);
        }
    };

    const addFromSearch = (video) => {
        const videoId = video.id?.videoId || video.id;
        socket?.emit("Subir Canción", {
            titulo: video.snippet?.title || "Video",
            artista: video.snippet?.channelTitle || "YouTube",
            tipo: "youtube",
            contenido: `https://www.youtube.com/watch?v=${videoId}`,
            portada: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url
        });
    };

    const handleSubir = async () => {
        if (!titulo.trim()) return;
        setUploading(true);
        try {
            let contenido = youtubeUrl.trim() || urlStream.trim();
            let tipo = youtubeUrl.trim() ? "youtube" : "url";
            
            if (audioFile) {
                const reader = new FileReader();
                contenido = await new Promise(res => {
                    reader.onload = (e) => res(e.target.result);
                    reader.readAsDataURL(audioFile);
                });
                tipo = "audio";
            }

            let portadaData = portadaPreview;

            socket?.emit("Subir Canción", {
                titulo: titulo.trim(),
                artista: artista.trim() || "Desconocido",
                tipo,
                contenido,
                portada: portadaData
            });

            setTitulo(""); setArtista(""); setYoutubeUrl(""); setUrlStream("");
            setAudioFile(null); setPortadaPreview(null); setTab("cola");
        } catch (e) {
            console.error("Error uploading:", e);
        } finally {
            setUploading(false);
        }
    };

    // ============================================
    // ⏱️ PROGRESS & YOUTUBE API
    // ============================================

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const update = () => {
            setCurrentTime(audio.currentTime);
            setDuration(audio.duration || 0);
        };
        audio.addEventListener("timeupdate", update);
        audio.addEventListener("loadedmetadata", update);
        audio.addEventListener("ended", handleEnded);
        return () => {
            audio.removeEventListener("timeupdate", update);
            audio.removeEventListener("loadedmetadata", update);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [handleEnded]);

    useEffect(() => {
        if (!cancionActual || cancionActual.tipo !== "youtube") return;
        
        const initYT = () => {
            const videoId = extractYouTubeId(cancionActual.contenido);
            if (!videoId) return;

            if (ytPlayerRef.current) {
                ytPlayerRef.current.loadVideoById(videoId);
                return;
            }

            ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
                height: "1", width: "1", videoId,
                playerVars: { autoplay: 0, playsinline: 1 },
                events: {
                    onReady: (e) => {
                        e.target.setVolume(volume * 100);
                        if (isPlaying) e.target.playVideo();
                    },
                    onStateChange: (e) => {
                        if (e.data === window.YT.PlayerState.ENDED) handleEnded();
                    }
                }
            });
        };

        if (!window.YT) {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
            window.onYouTubeIframeAPIReady = initYT;
        } else {
            initYT();
        }

        const interval = setInterval(() => {
            if (ytPlayerRef.current?.getCurrentTime) {
                setCurrentTime(ytPlayerRef.current.getCurrentTime());
                setDuration(ytPlayerRef.current.getDuration() || 0);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [cancionActual, handleEnded, isPlaying, volume]);

    useEffect(() => {
        if (!cancionActual) return;
        if ((cancionActual.tipo === "audio" || cancionActual.tipo === "url") && audioRef.current) {
            audioRef.current.src = cancionActual.contenido;
            audioRef.current.load();
            if (isPlaying) audioRef.current.play().catch(console.error);
        }
    }, [cancionActual, isPlaying]);

    useEffect(() => {
        if (open) setShow(true);
        else {
            const t = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(t);
        }
    }, [open]);

    if (!show) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return createPortal(
        <>
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} style={{ zIndex: 9998 }} onClick={onClose} />
            <div style={{ zIndex: 9999 }} className={`fixed bottom-20 right-4 w-80 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl border border-white/10 transition-all duration-300 ${open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`} onClick={e => e.stopPropagation()}>
                <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-white font-bold text-sm">🎵 Música</span>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition cursor-pointer">✖</button>
                </div>
                <div className="px-4 pt-4 pb-2 flex flex-col items-center gap-3">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center shadow-xl">
                        {cancionActual?.portada ? <img src={cancionActual.portada} className="w-full h-full object-cover" /> : <span className="text-5xl">🎵</span>}
                    </div>
                    <div className="text-center">
                        <p className="text-white font-bold text-sm truncate max-w-60">{cancionActual?.titulo || "Sin canción"}</p>
                        <p className="text-white/50 text-xs">{cancionActual?.artista || "—"}</p>
                    </div>
                </div>
                <div className="px-4">
                    <div ref={progressRef} onClick={handleSeek} className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer">
                        <div className="h-full bg-pink-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-4 px-4 py-3">
                    <button onClick={() => setShuffle(!shuffle)} className={`text-lg transition ${shuffle ? "text-pink-400" : "text-white/30"}`}>🔀</button>
                    <button onClick={playPrev} className="text-white hover:text-pink-400 transition text-xl">⏮</button>
                    <button onClick={isPlaying ? pause : play} className="w-12 h-12 rounded-full bg-pink-400 hover:bg-pink-500 flex items-center justify-center text-white text-xl shadow-lg transition">{isPlaying ? "⏸" : "▶"}</button>
                    <button onClick={playNext} className="text-white hover:text-pink-400 transition text-xl">⏭</button>
                    <button onClick={() => setRepeat(!repeat)} className={`text-lg transition ${repeat ? "text-pink-400" : "text-white/30"}`}>🔁</button>
                </div>
                <div className="flex items-center gap-2 px-4 pb-3">
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} className="flex-1 accent-pink-400" />
                </div>
                <div className="flex border-t border-white/10">
                    {["cola", "subir", "buscar", "eq"].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-xs font-bold transition ${tab === t ? "text-pink-400 border-b-2 border-pink-400" : "text-white/40"}`}>{t.toUpperCase()}</button>
                    ))}
                </div>
                <div className="max-h-64 overflow-y-auto">
                    {tab === "cola" && <MusicQueue canciones={canciones} currentIndex={currentIndex} onSelect={setCurrentIndex} onRemove={(id) => socket?.emit("Eliminar Canción", { cancionId: id })} />}
                    {tab === "subir" && (
                        <div className="p-4 flex flex-col gap-3">
                            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título *" className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-2" />
                            <input type="text" value={artista} onChange={e => setArtista(e.target.value)} placeholder="Artista" className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-2" />
                            <input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="YouTube URL" className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-2" />
                            <button onClick={() => fileInputRef.current.click()} className="w-full bg-white/10 text-white/70 text-xs py-2 rounded-lg">MP3/WAV</button>
                            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files[0])} />
                            <button onClick={handleSubir} disabled={uploading} className="w-full bg-pink-400 text-white font-bold text-xs py-2 rounded-xl disabled:opacity-50">{uploading ? "Subiendo..." : "Agregar"}</button>
                        </div>
                    )}
                    {tab === "buscar" && (
                        <div className="p-3">
                            <div className="flex gap-2">
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchYouTube(searchQuery)} className="flex-1 bg-white/10 text-white text-xs rounded-lg px-3 py-2" />
                                <button onClick={() => searchYouTube(searchQuery)} className="bg-pink-400 p-2 rounded-lg">🔍</button>
                            </div>
                            {searchResults.map(v => (
                                <div key={v.id.videoId} className="flex gap-2 p-2 hover:bg-white/5 cursor-pointer" onClick={() => addFromSearch(v)}>
                                    <img src={v.snippet.thumbnails.default.url} className="w-10 h-10 rounded" />
                                    <div className="flex-1 truncate"><p className="text-xs text-white truncate">{v.snippet.title}</p></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div ref={ytContainerRef} className="hidden" />
            </div>
        </>,
        document.body
    );
}