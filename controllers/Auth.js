const otpService = require("../services/otpService");
const userService = require("../services/userService");
const tokenService = require("../services/tokenService");
const Jimp = require("jimp");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class Auth {
  async sendOtp(req, res) {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return;
    const otp = otpService.generateOTP(); //Generate OTP
    const ttl = 1000 * 60 * 2; //Time To Live (2 minutes)
    const expires = Date.now() + ttl; //Expire Time
    const data = `${phoneNumber}.${otp}.${expires}`; //Data to be hashed
    const hash = otpService.generateHash(data); //Generate Hash
    return res
      .status(200)
      .json({ phoneNumber, otp, hashToken: `${hash}.${expires}` });
  }

  async verifyOtp(req, res) {
    const { phoneNumber, otp, hashToken } = req.body;
    if (!phoneNumber || !otp || !hashToken) return;
    const [hash, expireTime] = hashToken.split(".");
    if (Date.now() > +expireTime)
      return res.status(400).json({ message: "OTP Expired" });
    const data = `${phoneNumber}.${otp}.${expireTime}`;
    const generatedhash = otpService.generateHash(data);
    const isValid = otpService.verifyOtp(hash, generatedhash);
    if (!isValid) return res.status(400).json({ message: "Invalid OTP" });
    let user;
    try {
      user = await userService.findUser({ phoneNumber });
      if (!user) user = await userService.createUser({ phoneNumber });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
    // Generate Tokens
    const { accessToken, refreshToken } = tokenService.generateTokens({
      _id: user._id,
      activated: false,
    });
    // Set cookies for tokens
    try {
      await tokenService.storeRefreshToken(refreshToken, user._id);
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      sameSite: "None",
      secure: true,
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      sameSite: "None",
      secure: true,
    });
    return res.status(200).json({ user, auth: true });
  }

  async activate(req, res) {
    const { name, avatar } = req.body;
    const userData = req.user;
    if (!name || !avatar) return;

    // Image Base64
    const buffer = Buffer.from(
      avatar.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
      "base64"
    );

    try {
      const jimResp = await Jimp.read(buffer);
      jimResp.resize(150, Jimp.AUTO);
      const resizedBuffer = await jimResp.getBufferAsync(Jimp.MIME_PNG);

      // Upload to Cloudinary
      const cloudinaryResp = await cloudinary.uploader.upload(
        `data:image/png;base64,${resizedBuffer.toString("base64")}`,
        {
          folder: "avatars",
          public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        }
      );

      const userId = userData._id;

      // Update user
      const user = await userService.findUser({ _id: userId });
      if (!user) return res.status(404).json({ message: "User not found!" });

      user.activated = true;
      user.name = name;
      user.avatar = cloudinaryResp.secure_url;
      user.save();
      return res.json({ user, auth: true });
    } catch (err) {
      return res.status(500).json({ message: "Could not process the image" });
    }
  }

  async refresh(req, res) {
    // get refresh token from cookie
    const { refreshToken: refreshTokenFromCookie } = req.cookies;
    // check if token is valid
    let userData;
    try {
      userData = await tokenService.verifyRefreshToken(refreshTokenFromCookie);
    } catch (err) {
      return res.status(401).json({ message: "Invalid Token" });
    }
    // Check if token is in db
    try {
      const token = await tokenService.findRefreshToken(
        userData._id,
        refreshTokenFromCookie
      );
      if (!token) {
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (err) {
      return res.status(500).json({ message: "Internal error" });
    }
    // check if valid user
    const user = await userService.findUser({ _id: userData._id });
    if (!user) {
      return res.status(404).json({ message: "No user" });
    }
    // Generate new tokens
    const { refreshToken, accessToken } = tokenService.generateTokens({
      _id: userData._id,
    });
    // Update refresh token
    try {
      await tokenService.updateRefreshToken(userData._id, refreshToken);
    } catch (err) {
      return res.status(500).json({ message: "Internal error" });
    }
    // put in cookie
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    // response
    return res.status(200).json({ user, auth: true });
  }

  async logout(req, res) {
    const { refreshToken } = req.cookies;
    await tokenService.removeToken(refreshToken);
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    return res.status(200).json({ user: null, auth: false });
  }
}

module.exports = new Auth();
