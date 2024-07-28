const { Server } = require("socket.io");
const { ACTIONS } = require("./actions");

const scoketInit = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  const socketUserMapping = {};

  io.on("connection", (socket) => {
    const leaveRoom = () => {
      const rooms = Array.from(socket.rooms).filter(
        (room) => room !== socket.id
      );
      rooms.forEach((roomId) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        clients.forEach((clientId) => {
          io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
            peerId: socket.id,
            userId: socketUserMapping[socket.id]?._id,
          });
          socket.emit(ACTIONS.REMOVE_PEER, {
            peerId: clientId,
            userId: socketUserMapping[clientId]?._id,
          });
        });
        socket.leave(roomId);
      });
      delete socketUserMapping[socket.id];
    };
    // Handle New User Join
    socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
      socketUserMapping[socket.id] = user;
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      clients.forEach((clientId) => {
        //emit add_peer event to all clients in the room
        io.to(clientId).emit(ACTIONS.ADD_PEER, {
          peerId: socket.id,
          createOffer: false,
          user,
        });
        //emit add_peer event to the newly joined client
        socket.emit(ACTIONS.ADD_PEER, {
          peerId: clientId,
          createOffer: true,
          user: socketUserMapping[clientId],
        });
      });
      socket.join(roomId);
    });
    // Handle relay ice
    socket.on(ACTIONS.RELAY_ICE, ({ peerId, iceCandidate }) => {
      io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
        peerId: socket.id,
        iceCandidate,
      });
    });
    // Handle relay sdp (session description)
    socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
      io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
        peerId: socket.id,
        sessionDescription,
      });
    });
    // Handle Leave Room
    socket.on(ACTIONS.LEAVE, leaveRoom);
    socket.on("disconnecting", leaveRoom);
  });
};

exports.socketInit = scoketInit;
