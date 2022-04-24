var express = require('express');
var router = express.Router();

//사용자 About Me CRUD
router.use("/", require("./main"));

module.exports = router;