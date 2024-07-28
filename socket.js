const { Server } = require("socket.io");
const { ACTIONS } = require("./actions");

// Initialize Socket.IO server
const socketInit = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  const socketUserMapping = {}; // Maps socket Id's to user data

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    // Handles new user joining a room
    const joinNewUser = ({ roomId, user }) => {
      // Map the current socket Id to the user object
      socketUserMapping[socket.id] = user;
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      clients.forEach((clientId) => {
        // Notify existing clients of the new user in room
        io.to(clientId).emit(ACTIONS.ADD_PEER, {
          peerId: socket.id,
          createOffer: false,
          user,
        });
        // Notify the new user of the existing clients in room
        socket.emit(ACTIONS.ADD_PEER, {
          peerId: clientId,
          createOffer: true,
          user: socketUserMapping[clientId],
        });
      });
      socket.join(roomId); // Add the new user to the room
    };
    // Relays ICE_CANDIDATE to the specified peer
    const relayIce = ({ peerId, iceCandidate }) => {
      io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
        peerId: socket.id,
        iceCandidate,
      });
    };
    // Relays SESSION_DESCRIPTION (offer/answer) to the specified peer
    const relaySdp = ({ peerId, sessionDescription }) => {
      io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
        peerId: socket.id,
        sessionDescription,
      });
    };
    // Handles user leaving the room
    const leaveRoom = () => {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((roomId) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        clients.forEach((clientId) => {
          // Notify each client in the room that the current socket (peer) is leaving
          io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
            peerId: socket.id,
            userId: socketUserMapping[socket.id]?._id,
          });
          // Notify the socket that is leaving about each remaining client in the room
          socket.emit(ACTIONS.REMOVE_PEER, {
            peerId: clientId,
            userId: socketUserMapping[clientId]?._id,
          });
        });
        socket.leave(roomId); // Remove the socket from the room
      });
      // Remove the socket's user information from the mapping
      delete socketUserMapping[socket.id];
    };
    // Handles muting a user
    const handleMute = ({ roomId, userId }) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      clients.forEach((clientId) => {
        // Notify each client in the room that the current socket (peer) is muted
        io.to(clientId).emit(ACTIONS.MUTE, {
          peerId: socket.id,
          userId,
        });
      });
    };
    // Handles unmuting a user
    const handleUnMute = ({ roomId, userId }) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      clients.forEach((clientId) => {
        // Notify each client in the room that the current socket (peer) is unmuted
        io.to(clientId).emit(ACTIONS.UN_MUTE, {
          peerId: socket.id,
          userId,
        });
      });
    };

    socket.on(ACTIONS.JOIN, joinNewUser);
    socket.on(ACTIONS.RELAY_ICE, relayIce);
    socket.on(ACTIONS.RELAY_SDP, relaySdp);
    socket.on(ACTIONS.LEAVE, leaveRoom);
    socket.on("disconnecting", leaveRoom);
    socket.on(ACTIONS.MUTE, handleMute);
    socket.on(ACTIONS.UN_MUTE, handleUnMute);
  });
};

exports.socketInit = socketInit;
