var express = require('express');
var router = express.Router();

const defaultRes = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const db = require('../../module/pool');
const authUtil = require('../../module/utils/authUtil');

/*
사용자 캐릭터 애정도 조회 
METHOD       : GET
URL          : /selfLove
HEADERS      : token = 사용자 토큰
*/

router.get('/', authUtil, async(req, res) => {
    
    const selectUsrDtlQuery = `
    SELECT usrChrName, usrChrLove
    FROM UsrDtl
    WHERE usrIdx = ?
    `;

    //Query Value
    const usrIdx = req.decoded.usrIdx;

    //Query Result
    const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);

    const resData = {
        usrChrName: selectUsrDtlResult[0].usrChrName,
        usrChrLove: Math.round(selectUsrDtlResult[0].usrChrLove)
    };

    //결과
    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_GET_SELFLOVE, resData));
});

module.exports = router;