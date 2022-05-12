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
BODY         : level = 캐릭터 표정 레벨(0(처음),1,2,3)
               imgs = 캐릭터 표정 이미지
*/

router.post('/expression', upload.array('imgs'), async (req, res) => {

    const imgs = req.files;

    const chrExpLv = req.body.level;
    
    for (let i = 0; i < imgs.length; i++) {
        const insertChrExpQuery = 'INSERT INTO ChrExp(chrExpLv, chrExpImg) VALUES (?, ?)';
        const chrExpImg = imgs[i].location;
        const insertChrExpResult = await db.queryParam_Arr(insertChrExpQuery, [chrExpLv, chrExpImg]);

        if (!insertChrExpResult) {
            res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_REGISTER_CHARACTER_EXPRESSION));
        }
    }

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_CHARACTER_EXPRESSION)); 
});

/*
캐릭터 배경 등록용
METHOD       : POST
URL          : /register/character/background
BODY         : imgs = 캐릭터 배경 이미지
*/

router.post('/background', upload.array('imgs'), async (req, res) => {

    const imgs = req.files;

    for (let i = 0; i < imgs.length; i++) {
        const insertChrBgQuery = 'INSERT INTO ChrBg(chrBgImg) VALUES (?)';
        const chrBgImg = imgs[i].location;
        console.log(chrBgImg);
        const insertChrBgResult = await db.queryParam_Arr(insertChrBgQuery, [chrBgImg]);

        if (!insertChrBgResult) {
            res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_REGISTER_CHARACTER_BACKGROUND));
        }
    }

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_CHARACTER_BACKGROUND));
});

/*
캐릭터 연지곤지 등록용
METHOD       : POST
URL          : /register/character/cheek
BODY         : imgs = 캐릭터 연지곤지 이미지
*/

router.post('/cheek', upload.array('imgs'), async (req, res) => {

    const imgs = req.files;

    for (let i = 0; i < imgs.length; i++) {
        const insertChrChkQuery = 'INSERT INTO ChrChk(chrChkImg) VALUES (?)';
        const chrChkImg = imgs[i].location;
        const insertChrChkResult = await db.queryParam_Arr(insertChrChkQuery, [chrChkImg]);

        if (!insertChrChkResult) {
            res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_REGISTER_CHARACTER_CHEEK));
        }
    }

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_CHARACTER_CHEEK));
});

module.exports = router;