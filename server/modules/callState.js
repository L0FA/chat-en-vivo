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
    }

    function getSocketId(username) {
        return userSockets.get(username);
    }

    function emitToUser(username, event, data) {
        const socketId = getSocketId(username);
        if (!socketId) return false;
        io.to(socketId).emit(event, data);
        return true;
    }

    function startCall({ from, to, type }) {
        const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        activeCalls.set(callId, {
            from,
            to,
            type,
            status: "calling"
        });

        emitToUser(to, "Llamada Entrante", {
            from,
            type,
            callId
        });

        return callId;
    }

    function acceptCall({ callId, from, to }) {
        const call = activeCalls.get(callId);
        if (!call) return;

        call.status = "active";

        emitToUser(to, "Llamada Aceptada", { from });
        emitToUser(from, "Llamada Aceptada", { from: to });
    }

    function endCall({ from, to }) {
        emitToUser(to, "Llamada Terminada", { from });
        emitToUser(from, "Llamada Terminada", { from: to });
    }

    return {
        registerUser,
        unregisterUser,
        startCall,
        acceptCall,
        endCall,
        activeCalls
    };
}
