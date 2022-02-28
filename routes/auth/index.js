var express = require('express');
var router = express.Router();

//회원가입
router.use("/signup", require("./signup"));

module.exports = router;