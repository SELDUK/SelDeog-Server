var express = require('express');
var router = express.Router();

//달력 조회
router.use("/", require("./main"));

module.exports = router;