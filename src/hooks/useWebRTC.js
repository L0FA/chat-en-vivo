// ============================================
// 🎥 HOOK DE WEBCRTC - Lógica de conexión peer-to-peer
// Maneja RTCPeerConnection, ICE candidates, tracks y streaming
// Archivo: src/hooks/useWebRTC.js
// ============================================

import { useRef, useCallback } from "react";

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
];

/**
 * Hook para gestionar la conexión WebRTC
 * @param {Object} options - { socket, localStream, onRemoteStream, onConnectionStateChange }
 */
export function useWebRTC({ socket, localStream, onRemoteStream, onConnectionStateChange }) {
    const peerConnectionRef = useRef(null);

    /**
     * Crea una nueva conexión peer y configura listeners
     * @param {string} peerId - ID del peer remoto
     */
    const createPeerConnection = useCallback((peerId) => {
        // Cerrar conexión anterior si existe
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionRef.current = pc;

        // Agregar tracks locales
        localStream?.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStream.current);
        });

        // Listener: recibir stream remoto
        pc.ontrack = (event) => {
            const stream = event.streams[0];
            if (stream && onRemoteStream) {
                onRemoteStream(stream);
            }
        };

        // Listener: ICE candidate - enviar al peer remoto
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit("webrtc:ice", { candidate: event.candidate, target: peerId });
            }
        };

        // Listener: cambio de estado de conexión
        pc.onconnectionstatechange = () => {
            console.log("🔗 Connection state:", pc.connectionState);
            if (onConnectionStateChange) {
                onConnectionStateChange(pc.connectionState);
            }
        };

        return pc;
    }, [socket, localStream, onRemoteStream, onConnectionStateChange]);

    /**
     * Agrega un ICE candidate recibido del peer remoto
     * @param {RTCIceCandidate} candidate 
     */
    const addIceCandidate = useCallback(async (candidate) => {
        try {
            await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error("Error adding ICE:", e);
        }
    }, []);

    /**
     * Establece la descripción remota (offer/answer)
     * @param {RTCSessionDescription} description 
     */
    const setRemoteDescription = useCallback(async (description) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(description));
        }
    }, []);

    /**
     * Crea y devuelve un offer
     */
    const createOffer = useCallback(async () => {
        if (!peerConnectionRef.current) return null;
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        return offer;
    }, []);

    /**
     * Crea y devuelve un answer
     * @param {RTCSessionDescription} offer - Description remota
     */
    const createAnswer = useCallback(async (offer) => {
        if (!peerConnectionRef.current) return null;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        return answer;
    }, []);

    /**
     * Cierra y limpia la conexión
     */
    const closePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
    }, []);

    /**
     * Reemplaza el track de video (para screen share)
     * @param {MediaStreamTrack} track 
     */
    const replaceVideoTrack = useCallback(async (track) => {
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
        if (sender && track) {
            await sender.replaceTrack(track);
        }
    }, []);

    return {
        peerConnection: peerConnectionRef,
        createPeerConnection,
        addIceCandidate,
        setRemoteDescription,
        createOffer,
        createAnswer,
        closePeerConnection,
        replaceVideoTrack
    };
}