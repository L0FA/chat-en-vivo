// ============================================
// 🎵 ADD SONG FORM - Formulario para agregar canciones
// Opciones: YouTube URL, archivo de audio, o URL directa
// Archivo: src/components/music/AddSongForm.jsx
// ============================================

import { useState } from "react";
import { extractYouTubeId, getAudioType } from "../../utils/musicUtils";

/**
 * Formulario para agregar nuevas canciones
 * @param {Object} props
 * @param {function} props.onSubmit - Submit de canción { titulo, artista, url, tipo, portada? }
 * @param {boolean} props.uploading - Si está subiendo archivo
 */
export default function AddSongForm({ onSubmit, uploading }) {
    const [activeTab, setActiveTab] = useState("youtube"); // youtube | file | url
    const [titulo, setTitulo] = useState("");
    const [artista, setArtista] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [portadaFile, setPortadaFile] = useState(null);
    const [portadaPreview, setPortadaPreview] = useState(null);
    const [urlStream, setUrlStream] = useState("");

    const handleFileChange = (e, setFile, setPreview) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (ev) => setPreview(ev.target.result);
                reader.readAsDataURL(file);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let songData = { titulo, artista };
        
        if (activeTab === "youtube" && youtubeUrl) {
            const videoId = extractYouTubeId(youtubeUrl);
            if (videoId) {
                songData.url = `https://www.youtube.com/watch?v=${videoId}`;
                songData.tipo = "youtube";
                if (!titulo) songData.titulo = "YouTube Video";
            }
        } else if (activeTab === "file" && audioFile) {
            // El archivo se maneja en el padre
            onSubmit({ ...songData, file: audioFile, portada: portadaPreview, tipo: "audio" });
            return;
        } else if (activeTab === "url" && urlStream) {
            const tipo = getAudioType(urlStream);
            songData.url = urlStream;
            songData.tipo = tipo || "url";
        } else {
            return;
        }
        
        onSubmit(songData);
        
        // Limpiar formulario
        setTitulo("");
        setArtista("");
        setYoutubeUrl("");
        setAudioFile(null);
        setPortadaFile(null);
        setPortadaPreview(null);
        setUrlStream("");
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
            {/* Tabs */}
            <div className="flex gap-2 mb-3">
                <button
                    type="button"
                    onClick={() => setActiveTab("youtube")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "youtube" 
                            ? "bg-pink-500 text-white" 
                            : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                >
                    📺 YouTube
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("file")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "file" 
                            ? "bg-pink-500 text-white" 
                            : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                >
                    📁 Archivo
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("url")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "url" 
                            ? "bg-pink-500 text-white" 
                            : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                >
                    🔗 URL
                </button>
            </div>

            {/* Inputs según tab */}
            <div className="space-y-2 mb-3">
                <input
                    type="text"
                    placeholder="Título"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm"
                />
                <input
                    type="text"
                    placeholder="Artista"
                    value={artista}
                    onChange={(e) => setArtista(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm"
                />

                {activeTab === "youtube" && (
                    <input
                        type="text"
                        placeholder="URL de YouTube"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm"
                    />
                )}

                {activeTab === "file" && (
                    <div className="space-y-2">
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileChange(e, setAudioFile)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white/60 text-sm file:mr-2 file:px-2 file:rounded file:border-0 file:bg-pink-500 file:text-white"
                        />
                        {portadaPreview && (
                            <img src={portadaPreview} alt="Portada" className="w-16 h-16 rounded object-cover" />
                        )}
                    </div>
                )}

                {activeTab === "url" && (
                    <input
                        type="text"
                        placeholder="URL de audio (MP3, WAV, etc)"
                        value={urlStream}
                        onChange={(e) => setUrlStream(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/30 text-sm"
                    />
                )}
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={uploading}
                className="w-full bg-pink-500 hover:bg-pink-400 disabled:bg-pink-500/50 text-white py-2 rounded-lg font-medium text-sm transition-colors"
            >
                {uploading ? "⏳ Agregando..." : "➕ Agregar a la cola"}
            </button>
        </form>
    );
}