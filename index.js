require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connect = require("./dbConfig");
const authRouter = require("./routes/Auth");

const corsOption = {
  credentials: true,
  origin: [process.env.CLIENT_URL],
};

app.use(cors(corsOption));
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter.router);

connect();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
