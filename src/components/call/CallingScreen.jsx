// ============================================
// 📞 CALLING SCREEN - Pantalla de "Conectando..." mientras se establece la llamada
// Archivo: src/components/call/CallingScreen.jsx
// ============================================

/**
 * Pantalla mostrada mientras se intenta conectar una llamada
 * @param {string} targetUser - Usuario al que estamos llamando
 * @param {function} onCancel - Cancelar la llamada
 */
export default function CallingScreen({ targetUser, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-20 h-20 rounded-full border-4 border-pink-400 border-t-transparent animate-spin mx-auto mb-4"/>
                <p className="text-white text-xl">Conectando...</p>
                <button onClick={onCancel} className="mt-4 bg-red-500 text-white px-6 py-2 rounded-full">
                    Cancelar
                </button>
            </div>
        </div>
    );
}