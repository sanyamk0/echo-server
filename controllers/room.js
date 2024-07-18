const roomService = require("../services/roomService");

class Room {
  async createRoom(req, res) {
    const { topic, roomType } = req.body;
    if (!topic || !roomType)
      return res.status(400).json({ message: "All Fields Required!!" });
    const room = await roomService.createRoom({
      topic,
      roomType,
      ownerId: req.user._id,
    });
    return res.status(201).json(room);
  }

  async getAllRooms(req, res) {
    const rooms = await roomService.getRooms(["open"]);
    return res.status(200).json(rooms);
  }

  async getRoom(req, res) {
    const room = await roomService.getRoom(req.params.roomId);
    return res.status(200).json(room);
  }
}

module.exports = new Room();
