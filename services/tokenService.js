const jwt = require("jsonwebtoken");
const { RefreshToken } = require("../models/RefreshToken");

const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, accessTokenSecret, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(payload, refreshTokenSecret, {
      expiresIn: "1y",
    });
    return { accessToken, refreshToken };
  }

  async storeRefreshToken(refreshToken, userId) {
    try {
      await RefreshToken.create({
        refreshToken,
        userId,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async verifyAccessToken(token) {
    try {
      return jwt.verify(token, accessTokenSecret);
    } catch (error) {
      return null;
    }
  }

  async verifyRefreshToken(token) {
    try {
      return jwt.verify(token, refreshTokenSecret);
    } catch {
      return null;
    }
  }

  async findRefreshToken(userId, refreshToken) {
    return await RefreshToken.findOne({
      userId: userId,
      refreshToken: refreshToken,
    });
  }

  async updateRefreshToken(userId, refreshToken) {
    return await RefreshToken.updateOne(
      { userId: userId },
      { refreshToken: refreshToken }
    );
  }

  async removeToken(refreshToken) {
    return await RefreshToken.deleteOne({ refreshToken: refreshToken });
  }
}

module.exports = new TokenService();
