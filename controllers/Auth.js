const otpService = require("../services/otpService");
const userService = require("../services/userService");
const tokenService = require("../services/tokenService");

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
}

module.exports = new Auth();
