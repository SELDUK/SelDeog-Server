var express = require('express');
var router = express.Router();

const upload = require('../../config/multer');

const defaultRes = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const db = require('../../module/pool');

/*
캐릭터 모양,색 등록용
METHOD       : POST
URL          : /register/character/shapeColor
BODY         : shape = 캐릭터 베이스 모양
               color = 캐릭터 베이스 색
               img = 캐릭터 베이스 이미지
*/

router.post('/shapeColor', upload.single('img'), async (req, res) => {

    //ChrShpClr 테이블에 INSERT
    const insertChrShpClrQuery = 'INSERT INTO ChrShpClr(chrShp, chrClr, chrShpClrImg) VALUES (?, ?, ?)';

    //Query Value
    const chrShp = req.body.shape;
    const chrClr = req.body.color;
    const chrShpClrImg = req.file.location;

    //Query Result
    const insertChrShpClrResult = await db.queryParam_Arr(insertChrShpClrQuery, [chrShp, chrClr, chrShpClrImg]);

    //결과 확인
    if (Object.keys(insertChrShpClrResult).length == 0) {
        res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_REGISTER_CHARACTER_SHAPE_COLOR));
    }
    else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_CHARACTER_SHAPE_COLOR)); 
    }
});

/*
캐릭터 특징 등록용
METHOD       : POST
URL          : /register/character/feature
BODY         : img = 캐릭터 특징 이미지
*/

router.post('/feature', upload.single('img'), async (req, res) => {

    //ChrFt 테이블에 INSERT
    const insertChrFtQuery = 'INSERT INTO ChrFt(chrFtImg) VALUES (?)';

    //Query Value
    const chrFtImg = req.file.location;

    //Query Result
    const insertChrFtResult = await db.queryParam_Arr(insertChrFtQuery, [chrFtImg]);

    //결과 확인
    if (Object.keys(insertChrFtResult).length == 0) {
        res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_REGISTER_CHARACTER_FEATURE));
    }
    else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_CHARACTER_FEATURE)); 
    }
});

/*
캐릭터 표정 등록용
METHOD       : POST
URL          : /register/character/expression
BODY         : level = 캐릭터 표정 레벨(0(처음),1,2)
               img = 캐릭터 표정 이미지
*/

router.post('/expression', upload.single('img'), async (req, res) => {

    //ChrExp 테이블에 INSERT
    const insertChrExpQuery = 'INSERT INTO ChrExp(chrExpLv, chrExpImg) VALUES (?, ?)';

    //Query Value
    const chrExpLv = req.body.level;
    const chrExpImg = req.file.location;

    //Query Result
    const insertChrExpResult = await db.queryParam_Arr(insertChrExpQuery, [chrExpLv, chrExpImg]);

    //결과 확인
    if (Object.keys(insertChrExpResult).length == 0) {
        res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_REGISTER_CHARACTER_EXPRESSION));
    }
    else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_CHARACTER_EXPRESSION)); 
    }
});

/*
캐릭터 배경 등록용
METHOD       : POST
URL          : /register/character/background
BODY         : img = 캐릭터 배경 이미지
*/

router.post('/background', upload.single('img'), async (req, res) => {

    //ChrBg 테이블에 INSERT
    const insertChrBgQuery = 'INSERT INTO ChrBg(chrBgImg) VALUES (?)';

    //Query Value
    const chrBgImg = req.file.location;

    //Query Result
    const insertChrBgResult = await db.queryParam_Arr(insertChrBgQuery, [chrBgImg]);

    //결과 확인
    if (Object.keys(insertChrBgResult).length == 0) {
        res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_REGISTER_CHARACTER_BACKGROUND));
    }
    else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_CHARACTER_BACKGROUND)); 
    }
});

/*
캐릭터 이벤트 등록용
METHOD       : POST
URL          : /register/character/cheek
BODY         : img = 캐릭터 연지곤지 이미지
*/

router.post('/cheek', upload.single('img'), async (req, res) => {

    //ChrChk 테이블에 INSERT
    const insertChrChkQuery = 'INSERT INTO ChrChk(chrChkImg) VALUES (?)';

    //Query Value
    const chrChkImg = req.file.location;

    //Query Result
    const insertChrChkResult = await db.queryParam_Arr(insertChrChkQuery, [chrChkImg]);

    //결과 확인
    if (Object.keys(insertChrChkResult).length == 0) {
        res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_REGISTER_CHARACTER_CHEEK));
    }
    else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_CHARACTER_CHEEK)); 
    }
});

/* ------------------------------------------------------------------------------- */

/*
DateTest 등록용
METHOD       : POST
URL          : /character/register/datetest
*/

router.post('/datetest', async (req, res) => {

    //DateTest 테이블에 INSERT
    const insertDateTestQuery = 'INSERT INTO DateTest(updatedDate) VALUES (?)';
    // const today = new Date();   

    // const year = today.getFullYear(); // 년도
    // const month = today.getMonth() + 1;  // 월
    // const date = today.getDate();  // 날짜
    const insertDateTestResult = await db.queryParam_Arr(insertDateTestQuery, ['2022-02-03']);

    //결과 확인
    if (!insertDateTestResult) {
        console.log("DB에 캐릭터를 삽입할 수 없습니다.");
        res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.DB_ERROR));
    }
    else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_CATEGORY_REGISTER)); 
    }
});

/*
Data 등록용
METHOD       : POST
URL          : /character/register/data
*/

router.post('/data', async (req, res) => {

    //DateTest 테이블에 INSERT
    const insertDataQuery = 'INSERT INTO Data(createdDate, data) VALUES (?, ?)';
    const today = new Date();   

    const year = today.getFullYear(); // 년도
    const month = today.getMonth() + 1;  // 월
    const date = today.getDate();  // 날짜

    const createdDate = year + '-' + month +'-' + date;
    const insertDataResult1 = await db.queryParam_Arr(insertDataQuery, ['2022-02-04', '첫번째']);
    const insertDataResult2 = await db.queryParam_Arr(insertDataQuery, [createdDate, '두번째']);

    //결과 확인
    if (!insertDataResult2) {
        console.log("DB에 캐릭터를 삽입할 수 없습니다.");
        res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.DB_ERROR));
    }
    else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_CATEGORY_REGISTER)); 
    }
});

/*
DataTest의 날짜 ~ 현재 날짜 중 Data 개수 가져오기
METHOD       : GET
URL          : /character/register/between
*/

router.get('/between', async (req, res) => {

    const today = new Date();   
    const year = today.getFullYear(); // 년도
    const month = today.getMonth() + 1;  // 월
    const date = today.getDate();  // 날짜

    const currentDate = year + '-' + month +'-' + date;

    const selectDataQuery = `
        select count(*) as cnt from (select * from data where createdDate between (
            SELECT updatedDate FROM DateTest WHERE idx = ?
        ) and ?) datas
    `;
    const selectDataResult = await db.queryParam_Arr(selectDataQuery, [1, currentDate]);
    const notWriteCnt = selectDataResult[0].cnt;

    const selectDateDiffQuery = `
        select datediff(?, (
            SELECT updatedDate FROM DateTest WHERE idx = ?
        )) as dateDiff;
    `;
    const selectDateDiffResult = await db.queryParam_Arr(selectDateDiffQuery, [currentDate, 1]);
    const totalDateCnt = selectDateDiffResult[0].dateDiff;
    
    console.log(totalDateCnt - notWriteCnt);

    //결과 확인
    if (!selectDataResult) {
        console.log("DB에 캐릭터를 삽입할 수 없습니다.");
        res.status(200).send(defaultRes.successFalse(statusCode.OK, resMessage.DB_ERROR));
    }
    else {
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_CATEGORY_REGISTER)); 
    }
});

module.exports = router;