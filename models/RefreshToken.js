const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema(
  {
    refreshToken: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

const RefreshToken =
  mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", RefreshTokenSchema);

module.exports = { RefreshToken };
