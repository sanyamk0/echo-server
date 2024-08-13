require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connect = require("./dbConfig");
const authRouter = require("./routes/Auth");
const roomRouter = require("./routes/room");
const { socketInit } = require("./socket");
const app = express();
const server = require("http").createServer(app);

socketInit(server);

const corsOption = {
  credentials: true,
  origin: [process.env.CLIENT_URL],
};

app.use(cors(corsOption));
app.use(cookieParser());
app.use(express.json({ limit: "8mb" }));

app.use("/api/auth", authRouter.router);
app.use("/api/room", roomRouter.router);

connect();

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
