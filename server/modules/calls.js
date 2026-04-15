// ============================================
// 📞 CALLS MODULE - WebRTC video/audio calls
// Archivo: server/modules/calls.js
// ============================================

export function setupCalls(io, socket, connectedUsers) {

    // ---- CALL:INVITE ----
    socket.on("call:invite", ({ to, type }) => {
        console.log("📞 Invite de", connectedUsers.get(socket.id)?.nombre, "a", to, "tipo:", type);
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("call:invite", { from: connectedUsers.get(socket.id)?.nombre, type });
        }
    });

    // ---- CALL:LEAVE ----
    socket.on("call:leave", () => {
        const user = connectedUsers.get(socket.id);
        socket.broadcast.emit("call:leave", { user: user?.nombre });
    });

    // ---- CALL:END ----
    socket.on("call:end", () => {
        const user = connectedUsers.get(socket.id);
        socket.broadcast.emit("call:end", { user: user?.nombre });
    });

    // ---- CALL:REJECT ----
    socket.on("call:reject", ({ to }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("call:rejected", { from: connectedUsers.get(socket.id)?.nombre });
        }
    });

    // ---- CALL:ACCEPT ----
    socket.on("call:accept", ({ to }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("call:accepted", { from: connectedUsers.get(socket.id)?.nombre });
        }
    });

    // ---- CALL:JOIN ----
    socket.on("call:join", () => {
        const user = connectedUsers.get(socket.id);
        socket.broadcast.emit("call:join", { user: user?.nombre });
    });

    // ---- WEBRTC:OFFER ----
    socket.on("webrtc:offer", ({ offer, target }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === target)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("webrtc:offer", { offer, from: connectedUsers.get(socket.id)?.nombre });
        }
    });

    // ---- WEBRTC:ANSWER ----
    socket.on("webrtc:answer", ({ answer, target }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === target)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("webrtc:answer", { answer });
        }
    });

    // ---- WEBRTC:ICE ----
    socket.on("webrtc:ice", ({ candidate, target }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === target)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("webrtc:ice", { candidate });
        }
    });

    // ---- LLAMADA:INVITE (alternativo) ----
    socket.on("llamada:invite", ({ to, type }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("llamada:invite", { from: connectedUsers.get(socket.id)?.nombre, type });
        }
    });

    // ---- LLAMADA:ACCEPT ----
    socket.on("llamada:accept", ({ to, callId }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("llamada:accept", { from: connectedUsers.get(socket.id)?.nombre, callId });
        }
    });

    // ---- LLAMADA:REJECT ----
    socket.on("llamada:reject", ({ to }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("llamada:reject", { from: connectedUsers.get(socket.id)?.nombre });
        }
    });

    // ---- LLAMADA:END ----
    socket.on("llamada:end", ({ to }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("llamada:end", { from: connectedUsers.get(socket.id)?.nombre });
        }
    });

    // ---- LLAMADA:OFFER ----
    socket.on("llamada:offer", ({ offer, to }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("llamada:offer", { offer, from: connectedUsers.get(socket.id)?.nombre });
        }
    });

    // ---- LLAMADA:ANSWER ----
    socket.on("llamada:answer", ({ answer, to }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("llamada:answer", { answer });
        }
    });

    // ---- LLAMADA:ICE ----
    socket.on("llamada:ice", ({ candidate, to }) => {
        const targetSocket = [...connectedUsers.entries()].find(([, u]) => u.nombre === to)?.[0];
        if (targetSocket) {
            io.to(targetSocket).emit("llamada:ice", { candidate, from: connectedUsers.get(socket.id)?.nombre });
        }
    });
}

export default { setupCalls };