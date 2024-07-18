const { Room } = require("../models/Room");

class RoomService {
  async createRoom(payload) {
    const { topic, roomType, ownerId } = payload;
    const room = await Room.create({
      topic,
      roomType,
      ownerId,
      speakers: [ownerId],
    });
    return room;
  }

  async getRooms(types) {
    const rooms = await Room.find({ roomType: { $in: types } })
      .populate("speakers")
      .populate("ownerId")
      .exec();
    return rooms;
  }

  async getRoom(roomId) {
    const room = await Room.findOne({ _id: roomId });
    return room;
  }
}

module.exports = new RoomService();
