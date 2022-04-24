var express = require('express');
var router = express.Router();

const crypto = require('crypto-promise');

const defaultRes = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const db = require('../../module/pool');

/*
회원가입
METHOD       : POST
URL          : /auth/signup
BODY         : id = 회원가입 아이디
               password = 회원가입 패스워드
*/

router.post('/', async(req, res) => {
    const signupQuery = 'INSERT INTO Usr (usrId, usrPwd, usrSalt) VALUES (?, ?, ?)';

    const buf = await crypto.randomBytes(64);
    const salt = buf.toString('base64');
    const hashedPw = await crypto.pbkdf2(req.body.password.toString(), salt, 1000, 32, 'SHA512');
    const signupResult = await db.queryParam_Arr(signupQuery, [req.body.id, hashedPw.toString('base64'), salt]);

    if (Object.keys(signupResult).length == 0) {
        res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_SIGNUP));
    } else { 
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_SIGNUP));
    }
});

/*
이메일 중복체크
METHOD       : GET
URL          : /auth/signup/check?id={id}
PARAMETER    : id = 아이디
*/

router.get('/check', async(req,res) =>{
    const checkidQuery = 'SELECT * FROM Usr WHERE usrId = ?';
    const checkidResult = await db.queryParam_Parse(checkidQuery, [req.query.id]);
    
    if (checkidResult.length == 0) {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USABLE_ID));
    } else {
        res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.ALREADY_EXIST_ID));
    }
});

module.exports = router;