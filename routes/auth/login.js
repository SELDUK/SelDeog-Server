var express = require('express');
var router = express.Router();

const crypto = require('crypto-promise');

const defaultRes = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const db = require('../../module/pool');

const jwtUtils = require('../../module/jwt');

/*
로그인
METHOD       : POST
URL          : /auth/login
BODY         : id = 아이디
               password = 패스워드
*/

router.post('/', async(req, res) => {
    const loginQuery = 'SELECT * FROM Usr WHERE usrId = ?';
    const loginResult = await db.queryParam_Arr(loginQuery, [req.body.id]);

    //아이디 존재X
    if(loginResult.length == 0){
        res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.NOT_EXIST_ID));
    }
    //아이디 존재 => 비밀번호 일치 검사
    else {
        const salt = loginResult[0].usrSalt;
        crypto.pbkdf2(req.body.password.toString(), salt, 1000, 32, 'SHA512', async (err, key) => {
            const hashedEnterPw = key.toString('base64');
            
            const canLogin = (loginResult[0].usrPwd == hashedEnterPw) ? true : false;

            //비밀번호 일치
            if(canLogin){
                const token = jwtUtils.sign(loginResult[0]);

                const selectUsrDtlQuery = 'SELECT * FROM UsrDtl WHERE usrIdx = ?';
                const usrIdx = loginResult[0].usrIdx;
                const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);
            
                //사용자 상세정보를 만들지 않은 사용자일 경우
                if (selectUsrDtlResult.length == 0){
                    res.status(210).json(defaultRes.successTrue(210, resMessage.SUCCESS_LOGIN_NOT_MADE_USER_DETAIL, token));
                }
                else {
                    res.status(211).send(defaultRes.successTrue(211, resMessage.SUCCESS_LOGIN_ALREADY_MADE_USER_DETAIL, token));
                }
            }
            //비밀번호 불일치
            else {
                res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.NOT_CORRECT_PASSWORD));
            }
        });
    }
});

module.exports = router;