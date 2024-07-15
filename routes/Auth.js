const express = require("express");
const Auth = require("../controllers/Auth");

const router = express.Router();

router.post("/send-otp", Auth.sendOtp);
router.post("/verify-otp", Auth.verifyOtp);

exports.router = router;
