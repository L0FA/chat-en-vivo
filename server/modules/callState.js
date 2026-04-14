export default function createCallState(io) {
    const userSockets = new Map();
    const activeCalls = new Map();

    function registerUser(socketId, username) {
        userSockets.set(username, socketId);
    }

    function unregisterUser(socketId) {
        for (const [user, id] of userSockets.entries()) {
            if (id === socketId) {
                userSockets.delete(user);
                break;
            }
        }
        for (const [callId, call] of activeCalls.entries()) {
            if (call.fromSocketId === socketId || call.toSocketId === socketId) {
                activeCalls.delete(callId);
            }
        }
    }

    function getSocketId(username) {
        return userSockets.get(username);
    }

    function _getUsername(socketId) {
        for (const [user, id] of userSockets.entries()) {
            if (id === socketId) return user;
        }
        return null;
    }

    function emitToUser(username, event, data) {
        const socketId = getSocketId(username);
        if (!socketId) return false;
        io.to(socketId).emit(event, data);
        return true;
    }

    function emitToSocket(socketId, event, data) {
        if (!socketId) return false;
        io.to(socketId).emit(event, data);
        return true;
    }

    function startCall({ from, fromSocketId, to, type }) {
        const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const toSocketId = getSocketId(to);

        if (!toSocketId) {
            console.log(`❌ Usuario ${to} no encontrado para llamada`);
            return null;
        }

        activeCalls.set(callId, {
            from,
            fromSocketId,
            to,
            toSocketId,
            type,
            status: "calling"
        });

        emitToSocket(toSocketId, "Llamada Entrante", {
            from,
            type,
            callId
        });

        console.log(`📞 Llamada iniciada: ${from} -> ${to} (callId: ${callId})`);
        return callId;
    }

    function acceptCall({ callId, from, to }) {
        const call = activeCalls.get(callId);
        if (!call) return;

        call.status = "active";

        emitToUser(to, "Llamada Aceptada", { from, callId });
        emitToUser(from, "Llamada Aceptada", { from: to, callId });

        console.log(`📞 Llamada aceptada: ${callId}`);
    }

    function rejectCall({ from, to }) {
        emitToUser(to, "Llamada Rechazada", { from });
        emitToUser(from, "Llamada Rechazada", { from: to });
    }

    function endCall({ from, to }) {
        emitToUser(to, "Llamada Terminada", { from });
        emitToUser(from, "Llamada Terminada", { from: to });
        console.log(`📞 Llamada terminada entre ${from} y ${to}`);
    }

    return {
        registerUser,
        unregisterUser,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        getSocketId,
        activeCalls
    };
}
