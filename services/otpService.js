const crypto = require("crypto");

class OTPService {
  generateOTP() {
    const otp = crypto.randomInt(100000, 999999);
    return otp;
  }

  generateHash(data) {
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    return hash;
  }

  verifyOtp(hash, generatedhash) {
    return hash === generatedhash;
  }
}

module.exports = new OTPService();
