const otpService = require("../services/otpService");
const userService = require("../services/userService");
const tokenService = require("../services/tokenService");
const Jimp = require("jimp");
const path = require("path");

class Auth {
  async sendOtp(req, res) {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return;
    const otp = otpService.generateOTP(); //Generate OTP
    const ttl = 1000 * 60 * 2; //Time To Live (2 minutes)
    const expires = Date.now() + ttl; //Expire Time
    const data = `${phoneNumber}.${otp}.${expires}`; //Data to be hashed
    const hash = otpService.generateHash(data); //Generate Hash
    res.status(200).json({ phoneNumber, otp, hashToken: `${hash}.${expires}` });
  }

  async verifyOtp(req, res) {
    const { phoneNumber, otp, hashToken } = req.body;
    if (!phoneNumber || !otp || !hashToken) return;
    const [hash, expireTime] = hashToken.split(".");
    if (Date.now() > +expireTime)
      res.status(400).json({ message: "OTP Expired" });
    const data = `${phoneNumber}.${otp}.${expireTime}`;
    const generatedhash = otpService.generateHash(data);
    const isValid = otpService.verifyOtp(hash, generatedhash);
    if (!isValid) res.status(400).json({ message: "Invalid OTP" });
    let user;
    try {
      user = await userService.findUser({ phoneNumber });
      if (!user) user = await userService.createUser({ phoneNumber });
    } catch (error) {
      console.log(error);
    }
    //Tokens
    const { accessToken, refreshToken } = tokenService.generateTokens({
      _id: user._id,
      activated: false,
    });
    // Set cookies for tokens
    await tokenService.storeRefreshToken(refreshToken, user._id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.json({ user, auth: true });
  }

  async activate(req, res) {
    // Activation logic
    const { name, avatar } = req.body;
    const userData = req.user;

    if (!name || !avatar)
      res.status(400).json({ message: "All fields are required!" });

    // Image Base64
    const buffer = Buffer.from(
      avatar.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
      "base64"
    );

    const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;

    try {
      const jimResp = await Jimp.read(buffer);
      jimResp
        .resize(150, Jimp.AUTO)
        .write(path.resolve(__dirname, `../storage/${imagePath}`));
    } catch (err) {
      res.status(500).json({ message: "Could not process the image" });
    }

    const userId = userData._id;

    // Update user
    try {
      const user = await userService.findUser({ _id: userId });
      if (!user) res.status(404).json({ message: "User not found!" });
      user.activated = true;
      user.name = name;
      user.avatar = `/storage/${imagePath}`;
      user.save();
      res.json({ user, auth: true });
    } catch (err) {
      res.status(500).json({ message: "Something went wrong!" });
    }
  }
}

module.exports = new Auth();
