const express = require("express");
const Auth = require("../controllers/Auth");
const router = express.Router();

router.post("/send-otp", Auth.sendOtp);

exports.router = router;
