const otpService = require("../services/otpService");

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
}

module.exports = new Auth();
