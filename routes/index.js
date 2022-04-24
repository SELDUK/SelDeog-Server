var express = require('express');
var router = express.Router();

router.use("/auth", require("./auth/index"));

router.use("/userDetail", require("./userDetail/index"));

router.use("/calendar", require("./calendar/index"));

router.use("/character", require("./character/index"));

router.use("/register", require("./register/index"));

router.use("/selfLove", require("./selfLove/index"));

router.use("/aboutMe", require("./aboutMe/index"));

module.exports = router;
