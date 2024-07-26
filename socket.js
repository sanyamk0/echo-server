const { Server } = require("socket.io");

const scoketInit = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket Connected: ", socket.id);
  });
};

exports.socketInit = scoketInit;
