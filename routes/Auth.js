const express = require("express");
const Auth = require("../controllers/auth");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/send-otp", Auth.sendOtp);
router.post("/verify-otp", Auth.verifyOtp);
router.post("/activate", authMiddleware, Auth.activate);

exports.router = router;
