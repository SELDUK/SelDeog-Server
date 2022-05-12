var express = require('express');
var router = express.Router();

//캐릭터 관련 등록(베이스, 표정, 특징, 배경)
router.use("/character", require("./character"));

//Dummy캐릭터 및 Dummy칭찬 등록
router.use("/", require("./main"));

module.exports = router;