var express = require('express');
var router = express.Router();

//사용자 캐릭터 애정도 조회
router.use("/", require("./main"));

module.exports = router;