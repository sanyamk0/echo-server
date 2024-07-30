const express = require("express");
const Auth = require("../controllers/Auth");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/send-otp", Auth.sendOtp);
router.post("/verify-otp", Auth.verifyOtp);
router.post("/activate", authMiddleware, Auth.activate);
router.get("/refresh", Auth.refresh);
router.get("/logout", authMiddleware, Auth.logout);

exports.router = router;
