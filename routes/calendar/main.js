var express = require('express');
var router = express.Router();

const defaultRes = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const db = require('../../module/pool');
const authUtil = require('../../module/utils/authUtil');

/*
달력 조회
METHOD       : GET
URL          : /calendar?date={date}            ex)2022년 3월 => /calendar?date=2022-03
PARAMETER    : date = 해당 년, 월
HEADERS      : token = 사용자 토큰
*/

router.get('/', authUtil, async(req, res) => {

    let resData = {};
    let usrChrImgs = [];

    /* 2. UsrChr 테이블에서 해당 달에 만든 사용자 캐릭터 이미지 가져오기 */
    const selectUsrChrQuery = `
    SELECT usrChrIdx, usrChrImg, usrChrDateCrt 
    FROM UsrChr 
    WHERE usrIdx = ? AND DATE_FORMAT(usrChrDateCrt, '%Y-%m') = ?
    ORDER BY usrChrDateCrt
    `;

    //Query Value
    const usrIdx = req.decoded.usrIdx;
    const date = req.query.date;

    //Query Result
    const selectUsrChrResult = await db.queryParam_Arr(selectUsrChrQuery, [usrIdx, date]);

    usrChrImgs = selectUsrChrResult;

    resData.usrChrImgs = usrChrImgs;

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_GET_CALENDAR, resData));
});

/*
달력 버튼 조회
METHOD       : GET
URL          : /calendar/button       
HEADERS      : token = 사용자 토큰
*/

router.get('/button', authUtil, async(req, res) => {

    const selectUsrDtlQuery = `
    SELECT usrChrImgDft
    FROM UsrDtl 
    WHERE usrIdx = ? 
    `;

    //Query Value
    const usrIdx = req.decoded.usrIdx;

    //Query Result
    const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_GET_CALENDAR_BUTTON, selectUsrDtlResult[0]));
});

module.exports = router;