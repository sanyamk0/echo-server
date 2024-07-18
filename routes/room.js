const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const Room = require("../controllers/room");

const router = express.Router();

router.post("/createRoom", authMiddleware, Room.createRoom);
router.get("/getAllRooms", authMiddleware, Room.getAllRooms);
router.get("/getRoom/:roomId", authMiddleware, Room.getRoom);

exports.router = router;
