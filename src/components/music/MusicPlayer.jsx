// ============================================
// 🎵 MUSIC PLAYER - Reproductor de audio principal
// Muestra info de canción actual, controls de play/pause, barra de progreso
// Archivo: src/components/music/MusicPlayer.jsx
// ============================================

import { formatTime } from "../../utils/musicUtils";

/**
 * Componente del reproductor principal
 * @param {Object} props
 * @param {Object} props.cancion - Canción actual
 * @param {boolean} props.isPlaying - Si está reproduciendo
 * @param {number} props.currentTime - Tiempo actual
 * @param {number} props.duration - Duración total
 * @param {number} props.volume - Volumen (0-1)
 * @param {function} props.onPlayPause - Toggle play/pause
 * @param {function} props.onSeek - Buscar posición
 * @param {function} props.onVolumeChange - Cambiar volumen
 * @param {React.ref} props.progressRef - Ref de la barra de progreso
 */
export default function MusicPlayer({ 
    cancion, 
    isPlaying, 
    currentTime, 
    duration, 
    volume,
    onPlayPause, 
    onSeek,
    onVolumeChange,
    progressRef 
}) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="bg-[#1a1a1a] p-4 rounded-t-xl border-t border-x border-white/10">
            {/* Info de canción */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-lg bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl">
                    🎵
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                        {cancion?.titulo || "Sin canción"}
                    </div>
                    <div className="text-white/50 text-sm truncate">
                        {cancion?.artista || "---"}
                    </div>
                </div>
            </div>

            {/* Barra de progreso */}
            <div 
                ref={progressRef}
                className="h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    onSeek(percent * duration);
                }}
            >
                <div 
                    className="h-full bg-pink-500 rounded-full relative group-hover:bg-pink-400 transition-colors"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* Tiempo */}
            <div className="flex justify-between text-xs text-white/50 mb-3">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            {/* Controles */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onPlayPause}
                        className="w-10 h-10 rounded-full bg-pink-500 hover:bg-pink-400 flex items-center justify-center text-white text-xl"
                    >
                        {isPlaying ? "⏸️" : "▶️"}
                    </button>
                </div>

                {/* Volumen */}
                <div className="flex items-center gap-2">
                    <span className="text-white/50">🔊</span>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                </div>
            </div>
        </div>
    );
}