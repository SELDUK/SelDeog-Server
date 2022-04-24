var express = require('express');
var router = express.Router();

const defaultRes = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const db = require('../../module/pool');
const authUtil = require('../../module/utils/authUtil');

/*
사용자 About Me 조회 
METHOD       : GET
URL          : /aboutMe?order={order}
PARAMETER    : order = new or old
HEADERS      : token = 사용자 토큰
*/

router.get('/', authUtil, async(req, res) => {

    let resData = {};
    let usrChrDicts = [];

    /* 1. UsrDtl 테이블에서 usrChrName 조회 */
    const selectUsrDtlQuery = `
    SELECT usrChrName
    FROM UsrDtl
    WHERE usrIdx = ?
    `;

    //Query Value
    const usrIdx = req.decoded.usrIdx;

    //Query Result
    const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);

    //결과
    resData.usrChrName = selectUsrDtlResult[0].usrChrName;

    /* 2. UsrChrDict 테이블에서 usrChrDictIdx, usrChrDictCont order 순으로 조회 */
    order = "";
    if(req.query.order == "new"){
        order = "DESC"
    } else {
        order = "ASC"
    }

    const selectUsrChrDictQuery = `
    SELECT usrChrDictIdx, usrChrDictCont, date_format(usrChrDictDate, '%Y-%m-%d') AS date
    FROM UsrChrDict
    WHERE usrIdx = ?
    ORDER BY usrChrDictDate ${order}
    `;

    //Query Result
    const selectUsrChrDictResult = await db.queryParam_Arr(selectUsrChrDictQuery, [usrIdx]);

    //결과
    usrChrDicts = selectUsrChrDictResult;
    resData.usrChrDicts = usrChrDicts;

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_GET_ABOUTME, resData));
});

/*
사용자 About Me 생성 
METHOD       : POST
URL          : /aboutMe
BODY         : content = 백과사전 내용
HEADERS      : token = 사용자 토큰
*/

router.post('/', authUtil, async(req, res) => {

    /* 1. UsrChrDict 테이블에 백과사전 내용 생성 */
    const insertUsrChrDictQuery = `
    INSERT 
    INTO UsrChrDict(usrIdx, usrChrDictCont)
    VALUES (?, ?)
    `;

    //Query Value
    const usrIdx = req.decoded.usrIdx;
    const usrChrDictCont = req.body.content;

    //Query Result
    const insertUsrChrDictResult = await db.queryParam_Arr(insertUsrChrDictQuery, [usrIdx, usrChrDictCont]);

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_CREATE_ABOUTME));
});

/*
사용자 About Me 수정
METHOD       : PUT
URL          : /aboutMe
BODY         : usrChrDictIdx = 백과사전 내용 인덱스
               content = 백과사전 내용
HEADERS      : token = 사용자 토큰
*/

router.put('/', authUtil, async(req, res) => {

    /* 1. UsrChrDict 테이블에 백과사전 내용 수정 */
    const updateUsrChrDictQuery = `
    UPDATE UsrChrDict
    SET usrChrDictCont = ?
    WHERE usrIdx = ? AND usrChrDictIdx = ?
    `;

    //Query Value
    const usrChrDictCont = req.body.content;
    const usrIdx = req.decoded.usrIdx;
    const usrChrDictIdx = req.body.usrChrDictIdx;

    //Query Result
    const updateUsrChrDictResult = await db.queryParam_Arr(updateUsrChrDictQuery, [usrChrDictCont, usrIdx, usrChrDictIdx]);

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_UPDATE_ABOUTME));
});

/*
사용자 About Me 삭제
METHOD       : DELETE
URL          : /aboutMe
BODY         : usrChrDictIdx = 백과사전 내용 인덱스
HEADERS      : token = 사용자 토큰
*/

router.delete('/', authUtil, async(req, res) => {

    /* 1. UsrChrDict 테이블에 백과사전 내용 삭제 */
    const deleteUsrChrDictQuery = `
    DELETE 
    FROM UsrChrDict
    WHERE usrIdx = ? AND usrChrDictIdx = ?
    `;

    //Query Value
    const usrIdx = req.decoded.usrIdx;
    const usrChrDictIdx = req.body.usrChrDictIdx;

    //Query Result
    const deleteUsrChrDictResult = await db.queryParam_Arr(deleteUsrChrDictQuery, [usrIdx, usrChrDictIdx]);

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_DELETE_ABOUTME));
});

module.exports = router;