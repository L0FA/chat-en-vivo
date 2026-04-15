// ============================================
// 🎵 UTILIDADES DE MÚSICA - Funciones helper para MusicApp
// Extrae IDs de YouTube, detecta tipo de audio, formatea tiempo
// Archivo: src/utils/musicUtils.js
// ============================================

// Regex para detectar URLs de música
export const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
export const SOUNDCLOUD_REGEX = /(?:soundcloud\.com\/[\w-]+\/[\w-]+)/;
export const SPOTIFY_REGEX = /(?:open\.spotify\.com\/track\/[\w]+)/;

/**
 * Extrae el ID de YouTube de una URL
 * @param {string} url - URL de YouTube
 * @returns {string|null} - ID del video o null
 */
export function extractYouTubeId(url) {
    const match = url.match(YOUTUBE_REGEX);
    return match ? match[1] : null;
}

/**
 * Detecta el tipo de audio basado en la URL
 * @param {string} url - URL o ruta del archivo
 * @returns {string} - "youtube" | "soundcloud" | "spotify" | "audio" | "url"
 */
export function getAudioType(url) {
    if (!url) return null;
    if (YOUTUBE_REGEX.test(url)) return "youtube";
    if (SOUNDCLOUD_REGEX.test(url)) return "soundcloud";
    if (SPOTIFY_REGEX.test(url)) return "spotify";
    if (url.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) return "audio";
    if (url.startsWith("data:")) return "audio";
    return "url";
}

/**
 * Formatea segundos a formato mm:ss
 * @param {number} seconds - Segundos
 * @returns {string} - Tiempo formateado
 */
export function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Valida si una URL es de un servicio de música válido
 * @param {string} url - URL a validar
 * @returns {boolean}
 */
export function isValidMusicUrl(url) {
    return YOUTUBE_REGEX.test(url) || 
           SOUNDCLOUD_REGEX.test(url) || 
           SPOTIFY_REGEX.test(url) ||
           url.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i);
}