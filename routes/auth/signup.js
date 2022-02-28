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
BODY         : email = 회원가입 이메일
               password = 회원가입 패스워드
*/

router.post('/', async(req, res) => {
    const signupQuery = 'INSERT INTO User (email, password, salt) VALUES (?, ?, ?)';

    const buf = await crypto.randomBytes(64);
    const salt = buf.toString('base64');
    const hashedPw = await crypto.pbkdf2(req.body.password.toString(), salt, 1000, 32, 'SHA512');
    const signupResult = await db.queryParam_Arr(signupQuery, [req.body.email, hashedPw.toString('base64'), salt]);

    if (!signupResult) {
        res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.FAIL_SIGNUP));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_SIGNUP));
    }
});

/*
이메일 중복체크
METHOD       : GET
URL          : /auth/signup/check?email={email}
PARAMETER    : email = 이메일
*/

router.get('/check', async(req,res) =>{
    const checkidQuery = 'SELECT * FROM User WHERE email = ?';
    const checkidResult = await db.queryParam_Parse(checkidQuery, [req.query.email]);
    
    if (checkidResult[0] == null) {
        console.log("이메일 사용 가능");
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.USABLE_EMAIL));
    } else {
        console.log("이미 존재하는 이메일");
        res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.ALREADY_EXIST_EMAIL));
    }
});

module.exports = router;