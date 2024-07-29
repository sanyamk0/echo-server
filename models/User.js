const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true },
    name: { type: String, required: false },
    avatar: {
      type: String,
      required: false,
      get: (avatar) => {
        if (avatar) {
          return `${process.env.SERVER_URL}${avatar}`;
        }
        return avatar;
      },
    },
    activated: { type: Boolean, required: false, default: false },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
  }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = { User };
