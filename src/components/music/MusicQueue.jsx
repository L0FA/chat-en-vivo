// ============================================
// 🎵 MUSIC QUEUE - Lista de canciones en cola
// Muestra lista de canciones con opción de eliminar y reordenar
// Archivo: src/components/music/MusicQueue.jsx
// ============================================

/**
 * Componente de cola de reproducción
 * @param {Object} props
 * @param {Array} props.canciones - Lista de canciones
 * @param {number} props.currentIndex - Índice de canción actual
 * @param {function} props.onSelect - Seleccionar canción
 * @param {function} props.onRemove - Eliminar canción
 */
export default function MusicQueue({ canciones, currentIndex, onSelect, onRemove }) {
    return (
        <div className="flex-1 overflow-y-auto p-2">
            {canciones.length === 0 ? (
                <div className="text-white/30 text-center py-8">
                    🎵 No hay canciones en cola
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    {canciones.map((c, i) => (
                        <div 
                            key={c.id}
                            onClick={() => onSelect(i)}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                i === currentIndex 
                                    ? "bg-pink-500/20 border border-pink-500/30" 
                                    : "hover:bg-white/5"
                            }`}
                        >
                            {/* Índice/número */}
                            <div className={`w-6 text-center text-sm ${
                                i === currentIndex ? "text-pink-400" : "text-white/30"
                            }`}>
                                {i === currentIndex ? "▶️" : i + 1}
                            </div>

                            {/* Portada o icono */}
                            <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-lg">
                                {c.portada ? (
                                    <img src={c.portada} alt="" className="w-full h-full object-cover rounded" />
                                ) : "🎵"}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm truncate ${i === currentIndex ? "text-pink-400" : "text-white"}`}>
                                    {c.titulo}
                                </div>
                                <div className="text-xs text-white/40 truncate">
                                    {c.artista}
                                </div>
                            </div>

                            {/* Botón eliminar */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(c.id); }}
                                className="w-6 h-6 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}