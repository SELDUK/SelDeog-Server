var express = require('express');
var router = express.Router();

//캐릭터 조회, 생성
router.use("/", require("./main"));

module.exports = router;