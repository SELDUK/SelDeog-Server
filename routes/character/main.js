var express = require('express');
var router = express.Router();
const jimp = require('jimp');
const AWS = require('aws-sdk');

const s3config = require('../../config/s3config')

const defaultRes = require('../../module/utils/utils');
const statusCode = require('../../module/utils/statusCode');
const resMessage = require('../../module/utils/responseMessage');

const db = require('../../module/pool');
const authUtil = require('../../module/utils/authUtil');
const formatDate = require('../../module/utils/formatDate');
const getRandomImage = require('../../module/utils/getRandomImage');

/*
캐릭터 상세 조회(중앙버튼 전용)
METHOD       : GET
URL          : /character?date={date}
PARAMETER    : date = 사용자 캐릭터 생성된 날짜(ex. /character?date=2022-04-11)
HEADERS      : token = 사용자 토큰
*/

router.get('/', authUtil, async(req, res) => {

    let resData = {};

    const selectUsrChrQuery = `
    SELECT usrChrIdx, usrChrImg
    FROM UsrChr
    WHERE usrIdx = ? AND usrChrDateCrt = ?
    `;

    //Query Value
    const usrIdx = req.decoded.usrIdx;
    const usrChrDateCrt = req.query.date;

    //Query Result
    const selectUsrChrResult = await db.queryParam_Arr(selectUsrChrQuery, [usrIdx, usrChrDateCrt]);

    const selectUsrDtlQuery = `
    SELECT usrChrName
    FROM UsrDtl
    WHERE usrIdx = ?
    `;

    //Query Result
    const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);

    //결과
    if(selectUsrChrResult.length == 0){
        res.status(400).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.FAIL_GET_CHARACTER_DETAIL));
    } else {
        const usrChrIdx = selectUsrChrResult[0].usrChrIdx;
        const usrChrImg = selectUsrChrResult[0].usrChrImg;
        const usrChrName = selectUsrDtlResult[0].usrChrName;

        resData.usrChrIdx = usrChrIdx;
        resData.usrChrImg = usrChrImg;
        resData.usrChrName = usrChrName;
        resData.usrChrDateCrt = usrChrDateCrt;
    
        /* 2. UsrChrCmt JOIN UsrChrCmtTag 테이블에서  칭찬, 태그 SELECT */
        const selectUsrChrCmtQuery = `
        SELECT UsrChrCmt.usrChrCmtIdx, UsrChrCmt.usrChrCmt, UsrChrCmtTag.usrChrCmtTagIdx, UsrChrCmtTag.usrChrCmtTag
        FROM UsrChrCmt
        LEFT JOIN UsrChrCmtTag
            ON UsrChrCmt.usrChrCmtIdx = UsrChrCmtTag.usrChrCmtIdx
        WHERE UsrChrCmt.usrChrIdx = ?
        ORDER BY UsrChrCmt.UsrChrCmtIdx ASC, UsrChrCmtTag.UsrChrCmtTagIdx ASC;
        `;
    
        //Query Result
        const selectUsrChrCmtResult = await db.queryParam_Arr(selectUsrChrCmtQuery, [usrChrIdx]);
    
        /* 3. DATA 정리 */
        if(selectUsrChrCmtResult.length == 0){
            resData.usrChrCmts = [];
        }
        else{
            let usrChrCmts = [];
    
            let usrChrCmtIdx = -1;
            let usrChrCmt = {};
            let usrChrCmtTags = [];
    
            for(let i = 0; i<selectUsrChrCmtResult.length; i++){
                if(selectUsrChrCmtResult[i].usrChrCmtIdx != usrChrCmtIdx){
                    if(Object.keys(usrChrCmt).length != 0){
                        usrChrCmts.push(usrChrCmt);
                    }
    
                    usrChrCmtIdx = selectUsrChrCmtResult[i].usrChrCmtIdx;
                    usrChrCmt = {};
                    usrChrCmtTags = [];
    
                    usrChrCmt.usrChrCmtIdx = selectUsrChrCmtResult[i].usrChrCmtIdx;
                    usrChrCmt.usrChrCmt = selectUsrChrCmtResult[i].usrChrCmt;

                    if(selectUsrChrCmtResult[i].usrChrCmtTag != null){
                        usrChrCmtTags.push(selectUsrChrCmtResult[i].usrChrCmtTag);
                    }
    
                    usrChrCmt.usrCmtTags = usrChrCmtTags;
                }
                else{
                    usrChrCmt.usrCmtTags.push(selectUsrChrCmtResult[i].usrChrCmtTag);
                }
            }
            usrChrCmts.push(usrChrCmt);
    
            resData.usrChrCmts = usrChrCmts;
        }
    
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_GET_CHARACTER_DETAIL, resData));
    }
});


/*
캐릭터 상세 조회
METHOD       : GET
URL          : /character/:usrChrIdx
PARAMETER    : usrChrIdx = 사용자 캐릭터 인덱스
HEADERS      : token = 사용자 토큰
*/

router.get('/:usrChrIdx', authUtil, async(req, res) => {

    let resData = {};

    /* 1. UsrChr 테이블에서 usrChrImg, usrChrDateCrt SELECT
          UstDtl 테이블에서 usrChrName SELECT */
    const selectUsrChrQuery = `
    SELECT usrChrImg, usrChrDateCrt
    FROM UsrChr
    WHERE usrIdx = ? AND usrChrIdx = ?
    `;

    //Query Value
    const usrIdx = req.decoded.usrIdx;
    const usrChrIdx = req.params.usrChrIdx;

    //Query Result
    const selectUsrChrResult = await db.queryParam_Arr(selectUsrChrQuery, [usrIdx, usrChrIdx]);

    const selectUsrDtlQuery = `
    SELECT usrChrName
    FROM UsrDtl
    WHERE usrIdx = ?
    `;

    //Query Result
    const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);

    if(selectUsrChrResult.length == 0){
        res.status(400).send(defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.FAIL_GET_CHARACTER_DETAIL));
    } else {
        const usrChrImg = selectUsrChrResult[0].usrChrImg;
        const usrChrDateCrt = selectUsrChrResult[0].usrChrDateCrt;
        const usrChrName = selectUsrDtlResult[0].usrChrName;

        resData.usrChrIdx = usrChrIdx;
        resData.usrChrImg = usrChrImg;
        resData.usrChrName = usrChrName;
        resData.usrChrDateCrt = usrChrDateCrt;
    
        /* 2. UsrChrCmt JOIN UsrChrCmtTag 테이블에서  칭찬, 태그 SELECT */
        const selectUsrChrCmtQuery = `
        SELECT UsrChrCmt.usrChrCmtIdx, UsrChrCmt.usrChrCmt, UsrChrCmtTag.usrChrCmtTagIdx, UsrChrCmtTag.usrChrCmtTag
        FROM UsrChrCmt
        LEFT JOIN UsrChrCmtTag
            ON UsrChrCmt.usrChrCmtIdx = UsrChrCmtTag.usrChrCmtIdx
        WHERE UsrChrCmt.usrChrIdx = ?
        ORDER BY UsrChrCmt.UsrChrCmtIdx ASC, UsrChrCmtTag.UsrChrCmtTagIdx ASC;
        `;
    
        //Query Result
        const selectUsrChrCmtResult = await db.queryParam_Arr(selectUsrChrCmtQuery, [usrChrIdx]);
    
        /* 3. DATA 정리 */
        if(selectUsrChrCmtResult.length == 0){
            resData.usrChrCmts = [];
        }
        else{
            let usrChrCmts = [];
    
            let usrChrCmtIdx = -1;
            let usrChrCmt = {};
            let usrChrCmtTags = [];
    
            for(let i = 0; i<selectUsrChrCmtResult.length; i++){
                if(selectUsrChrCmtResult[i].usrChrCmtIdx != usrChrCmtIdx){
                    if(Object.keys(usrChrCmt).length != 0){
                        usrChrCmts.push(usrChrCmt);
                    }
    
                    usrChrCmtIdx = selectUsrChrCmtResult[i].usrChrCmtIdx;
                    usrChrCmt = {};
                    usrChrCmtTags = [];
    
                    usrChrCmt.usrChrCmtIdx = selectUsrChrCmtResult[i].usrChrCmtIdx;
                    usrChrCmt.usrChrCmt = selectUsrChrCmtResult[i].usrChrCmt;
                    if(selectUsrChrCmtResult[i].usrChrCmtTag != null){
                        usrChrCmtTags.push(selectUsrChrCmtResult[i].usrChrCmtTag);
                    }
    
                    usrChrCmt.usrCmtTags = usrChrCmtTags;
                }
                else{
                    usrChrCmt.usrCmtTags.push(selectUsrChrCmtResult[i].usrChrCmtTag);
                }
            }
            usrChrCmts.push(usrChrCmt);
    
            resData.usrChrCmts = usrChrCmts;
        }
    
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_GET_CHARACTER_DETAIL, resData));
    }
});

/*
캐릭터 생성
METHOD       : POST
URL          : /character
BODY         : color = 사용자가 지정한 캐릭터 색
HEADERS      : token = 사용자 토큰
*/

router.post('/', authUtil, async(req, res) => {

    let images = [];

    /* 1. UserDtl 테이블에서 필요한 정보 받기 */
    //UsrDtl 테이블 SELECT
    const selectUsrDtlQuery = `
    SELECT usrChrShp, usrChrFtIdx
    FROM UsrDtl
    WHERE usrIdx = ?
    `;

    //Query Value
    const usrIdx = req.decoded.usrIdx;

    //Query Result
    const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);   

    //결과
    const usrChrShp = selectUsrDtlResult[0].usrChrShp;
    const usrChrFtIdx = selectUsrDtlResult[0].usrChrFtIdx;

    /* 2. 캐릭터 모양,색 이미지 받기 */
    //ChrShpClr 테이블 SELECT
    const selectChrShpClrQuery = `
    SELECT chrShpClrImg
    FROM ChrShpClr
    WHERE chrClr = ? AND chrShp = ?
    `;
    
    //Query Value
    const chrClr = req.body.color;

    //Query Result
    const selectChrShpClrResult = await db.queryParam_Arr(selectChrShpClrQuery, [chrClr, usrChrShp]);

    //이미지 push
    images.push(selectChrShpClrResult[0].chrShpClrImg);

    /* 3. 캐릭터 특징 이미지 받기 */
    if(usrChrFtIdx != null){
        //ChrFt 테이블 SELECT
        const selectChrFtQuery = `
        SELECT chrFtImg
        FROM ChrFt
        WHERE chrFtIdx = ?
        `;
    
        //Query Result
        const selectChrFtResult = await db.queryParam_Arr(selectChrFtQuery, [usrChrFtIdx]);
    
        //이미지 push
        images.push(selectChrFtResult[0].chrFtImg);
    }

    /* 4. 캐릭터 표정 이미지 받기 */
    //ChrExp 테이블 SELECT
    const selectChrExpQuery = `
    SELECT chrExpImg
    FROM ChrExp
    WHERE chrExpLv = 0
    `;

    //Query Result
    const selectChrExpResult = await db.queryParam_None(selectChrExpQuery);

    //이미지 push
    images.push(selectChrExpResult[0].chrExpImg);

    /* 4. 이미지 합성 */
    //이미지 합성
    for(let i = 0; i<images.length; i++){
        images[i] = await jimp.read(images[i]);
    }

    let baseImg = images[0];
    if(usrChrFtIdx != null){
        baseImg.composite(images[1], 0, 0);
    }
    const chrBaseImg = await baseImg.getBufferAsync(jimp.AUTO);

    let img = images[0];
    for(let i = 1; i<images.length; i++){
        img.composite(images[i], 0, 0);
    }
    const chrImg = await img.getBufferAsync(jimp.AUTO);

    /* 5. 이미지 s3에 넣기 */
    const AWS_BUCKET_NAME = s3config.AWS_BUCKET_NAME;
    const AWS_ACCESS_KEY_ID = s3config.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = s3config.AWS_SECRET_ACCESS_KEY;
    const AWS_REGION = s3config.AWS_REGION;
    const AWS_Uploaded_File_URL_LINK = s3config.AWS_Uploaded_File_URL_LINK;

    const today = new Date();   
    const year = today.getFullYear(); // 년도
    const month = today.getMonth() + 1;  // 월
    const date = today.getDate();  // 날짜

    const s3bucket = new AWS.S3({
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        region: AWS_REGION
    });

    const paramsChrBaseImg = {
        Bucket: AWS_BUCKET_NAME,
        Key: usrIdx + '/' + year + '/' + month + '/' + date + '/' + 'chrBaseImg',
        Body: chrBaseImg,
        ContentType: 'png',
        ACL: 'public-read'
    };

    const paramsChrImg = {
        Bucket: AWS_BUCKET_NAME,
        Key: usrIdx + '/' + year + '/' + month + '/' + date + '/' + 'chrImg',
        Body: chrImg,
        ContentType: 'png',
        ACL: 'public-read'
    };

    s3bucket.upload(paramsChrBaseImg, async(err, data1) => {
        s3bucket.upload(paramsChrImg, async(err, data2) => {
            const usrChrBaseImg = AWS_Uploaded_File_URL_LINK + '/' + usrIdx + '/' + year + '/' + month + '/' + date + '/' + 'chrBaseImg';
            const usrChrImg = AWS_Uploaded_File_URL_LINK + '/' + usrIdx + '/' + year + '/' + month + '/' + date + '/' + 'chrImg';
            /* 6. 캐릭터 삽입 */
            //UsrChr 테이블에 INSERT
            const insertUsrChrQuery = `
            INSERT 
            INTO UsrChr(usrIdx, usrChrImg, usrChrClr, usrChrLv, usrChrBaseImg) 
            VALUES (?, ?, ?, ?, ?)
            `;

            //Query Result
            const insertUsrChrResult = await db.queryParam_Arr(insertUsrChrQuery, [usrIdx, usrChrImg, chrClr, 0, usrChrBaseImg]);

            /* 7. UsrDtl테이블 usrChrLastCrt 업데이트 */
            const updateUsrDtlQuery = `
            UPDATE UsrDtl
            SET usrChrLasrCrt = ?
            WHERE usrIdx = ?
            `;
            
            //Query Value
            const usrChrLastCrt = formatDate(new Date());

            //Query Result
            const updateUsrDtlResult = await db.queryParam_Arr(updateUsrDtlQuery, [usrChrLastCrt, usrIdx]);
            
            //결과 확인
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_CREATE_CHARACTER)); 
        }); 
    }); 
});

/* *********************** 캐릭터 칭찬 관련 *********************** */
/*
캐릭터 코멘트 생성
METHOD       : POST
URL          : /character/:usrChrIdx/comment
PARAMETER    : usrChrIdx = 사용자 캐릭터 인덱스
BODY         : comment = 칭찬 내용
               tag = 태그 내용(배열)
HEADERS      : token = 사용자 토큰
*/

router.post('/:usrChrIdx/comment', authUtil, async(req, res) => {

    const usrIdx = req.decoded.usrIdx;
    
    /* 1. UsrChrCmt 테이블에 칭찬 생성 */
    const insertUsrChrCmtQuery = `
    INSERT 
    INTO UsrChrCmt(usrChrIdx, usrChrCmt) 
    VALUES (?, ?)
    `;

    //Query Value
    const usrChrIdx = req.params.usrChrIdx;
    const usrChrCmt = req.body.comment;

    //Query Result
    const insertUsrChrCmtResult = await db.queryParam_Arr(insertUsrChrCmtQuery, [usrChrIdx, usrChrCmt]);   

    //결과
    const usrChrCmtIdx = insertUsrChrCmtResult.insertId;

    /* 2. UsrChrCmtTag 테이블에 칭찬태그 생성 */
    const insertUsrChrCmtTagQuery = `
    INSERT 
    INTO UsrChrCmtTag(usrChrCmtIdx, usrChrCmtTag) 
    VALUES (?, ?)
    `;

    const tags = req.body.tag;
    for(let i = 0; i<tags.length; i++){
        const usrChrCmtTag = tags[i];
        
        //Query Result
        const insertUsrChrCmtTagResult = await db.queryParam_Arr(insertUsrChrCmtTagQuery, [usrChrCmtIdx, usrChrCmtTag]); 
    } 

    /* 3. UsrChr 테이블에서 usrChrLv(+1), usrChrBaseImg, ... 찾기 */
    const selectUsrChrQuery = `
    SELECT usrChrLv, usrChrBaseImg, usrChrChkIdx, usrChrExpFirIdx, usrChrExpSecIdx, usrChrBgIdx
    FROM UsrChr
    WHERE usrChrIdx = ?
    `;

    //Query Result
    const selectUsrChrResult = await db.queryParam_Arr(selectUsrChrQuery, [usrChrIdx]);  

    //결과
    const usrChrLv = selectUsrChrResult[0].usrChrLv + 1;

    const updateUsrChrQuery = `
    UPDATE UsrChr
    SET usrChrLv = ?
    WHERE usrChrIdx = ?
    `;

    //Query Result  
    const updateUsrChrResult = await db.queryParam_Arr(updateUsrChrQuery, [usrChrLv, usrChrIdx]);

    if(usrChrLv > 5){
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_CREATE_COMMENT)); 
    } 
    else {
        const selectUsrDtlQuery = `
        SELECT usrChrLove
        FROM UsrDtl
        WHERE usrIdx = ?
        `;

        //Query Result  
        const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);

        let usrChrLove = selectUsrDtlResult[0].usrChrLove + 0.2;

        if(usrChrLove > 98){
            usrChrLove = 98
        } 

        const updateUsrDtlQuery = `
        UPDATE UsrDtl
        SET usrChrLove = ?
        WHERE usrIdx = ?
        `;
    
        //Query Result  
        const updateUsrDtlResult = await db.queryParam_Arr(updateUsrDtlQuery, [usrChrLove, usrIdx]);

        if(usrChrLv == 5){
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_CREATE_COMMENT)); 
        } 
        else {
            let images = [];
            const usrChrBaseImg = selectUsrChrResult[0].usrChrBaseImg;
            
            /* 4. 레벨에 맞는 배경, 효과, 표정 랜덤으로 찾기 */
    
            /* 
            1. 1레벨일때 => 베이스 이미지에 연지곤지
            2. 2레벨일떄 => 베이스 이미지에 연지곤지랑 표정, 표정 인덱스 저장 
            3. 3레벨일때 => 베이스 이미지에 연지곤지랑 표정, 표정 인덱스 저장
            4. 4레벨일때 => 베이스 이미지에 연지곤지랑 표정, 배경, 배경인덱스 저장 
            */
    
            let usrChrChkIdx = selectUsrChrResult[0].usrChrChkIdx;
            let usrChrExpFirIdx = selectUsrChrResult[0].usrChrExpFirIdx;
            let usrChrExpSecIdx = selectUsrChrResult[0].usrChrExpSecIdx;
            let usrChrBgIdx = selectUsrChrResult[0].usrChrBgIdx;
    
            //1레벨(연지곤지)일 경우
            if(usrChrLv == 1){
                images.push(usrChrBaseImg);
    
                const selectChrExpQuery = `
                SELECT chrExpImg
                FROM ChrExp
                WHERE chrExpLv = 0
                `;
    
                const selectChrExpResult = await db.queryParam_None(selectChrExpQuery);
                images.push(selectChrExpResult[0].chrExpImg);
    
                let image;
                if(usrChrChkIdx == null){
                    const randomCheekImage = await getRandomImage('Chk');
                    usrChrChkIdx = randomCheekImage.idx;
                    image = randomCheekImage.image;
                } else {
                    const selectChrChkQuery = `
                    SELECT chrChkImg as image
                    FROM ChrChk
                    WHERE chrChkIdx = ${usrChrChkIdx}
                    `;
    
                    const selectChrChkResult = await db.queryParam_None(selectChrChkQuery);
                    image = selectChrChkResult[0].image;
                }
                images.push(image);
            } else if(usrChrLv == 2){
                images.push(usrChrBaseImg);
    
                let image;
                if(usrChrExpFirIdx == null){
                    const randomExpressionImage = await getRandomImage('Exp', 1);
                    usrChrExpFirIdx = randomExpressionImage.idx;
                    image = randomExpressionImage.image;
                } else {
                    const selectChrExpQuery = `
                    SELECT chrExpImg as image
                    FROM ChrExp
                    WHERE chrExpIdx = ${usrChrExpFirIdx}
                    `;
    
                    const selectChrExpResult = await db.queryParam_None(selectChrExpQuery);
                    image = selectChrExpResult[0].image;
                }
                images.push(image);
    
                const selectChrChkQuery = `
                SELECT chrChkImg
                FROM ChrChk
                WHERE chrChkIdx = ${usrChrChkIdx}
                `;
    
                const selectChrChkResult = await db.queryParam_None(selectChrChkQuery);
                images.push(selectChrChkResult[0].chrChkImg);
    
            } else if(usrChrLv == 3){
                images.push(usrChrBaseImg);
    
                let image;
                if(usrChrExpSecIdx == null){
                    const randomExpressionImage = await getRandomImage('Exp', 2);
                    usrChrExpSecIdx = randomExpressionImage.idx;
                    image = randomExpressionImage.image;
                } else {
                    const selectChrExpQuery = `
                    SELECT chrExpImg as image
                    FROM ChrExp
                    WHERE chrExpIdx = ${usrChrExpSecIdx}
                    `;
    
                    const selectChrExpResult = await db.queryParam_None(selectChrExpQuery);
                    image = selectChrExpResult[0].image;
                }
                images.push(image);
    
                const selectChrChkQuery = `
                SELECT chrChkImg
                FROM ChrChk
                WHERE chrChkIdx = ${usrChrChkIdx}
                `;
    
                const selectChrChkResult = await db.queryParam_None(selectChrChkQuery);
                images.push(selectChrChkResult[0].chrChkImg);
            }else{
                let image;
                if(usrChrBgIdx == null){
                    const randomBackgroundImage = await getRandomImage('Bg');
                    usrChrBgIdx = randomBackgroundImage.idx;
                    image = randomBackgroundImage.image;
                } else {
                    const selectChrBgQuery = `
                    SELECT chrBgImg as image
                    FROM ChrBg
                    WHERE chrBgIdx = ${usrChrBgIdx}
                    `;
    
                    const selectChrBgResult = await db.queryParam_None(selectChrBgQuery);
                    image = selectChrBgResult[0].image;
                }
                images.push(image);
    
                images.push(usrChrBaseImg);
    
                const selectChrExpQuery = `
                SELECT chrExpImg
                FROM ChrExp
                WHERE chrExpIdx = ${usrChrExpSecIdx}
                `;
    
                const selectChrExpResult = await db.queryParam_None(selectChrExpQuery);
                images.push(selectChrExpResult[0].chrExpImg);
    
                const selectChrChkQuery = `
                SELECT chrChkImg
                FROM ChrChk
                WHERE chrChkIdx = ${usrChrChkIdx}
                `;
    
                const selectChrChkResult = await db.queryParam_None(selectChrChkQuery);
                images.push(selectChrChkResult[0].chrChkImg);
            }   
        
            /* 5. 이미지 합성 후, UsrChr 테이블에 해당 사용자 캐릭터이미지 수정 */
            //이미지 합성
            for(let i = 0; i<images.length; i++){
                images[i] = await jimp.read(images[i]);
            }
        
            let img = images[0];
            for(let i = 1; i<images.length; i++){
                img.composite(images[i], 0, 0);
            }
            const chrImg = await img.getBufferAsync(jimp.AUTO);
        
            const AWS_BUCKET_NAME = s3config.AWS_BUCKET_NAME;
            const AWS_ACCESS_KEY_ID = s3config.AWS_ACCESS_KEY_ID;
            const AWS_SECRET_ACCESS_KEY = s3config.AWS_SECRET_ACCESS_KEY;
            const AWS_REGION = s3config.AWS_REGION;
            const AWS_Uploaded_File_URL_LINK = s3config.AWS_Uploaded_File_URL_LINK;
        
            const today = new Date();   
            const year = today.getFullYear(); // 년도
            const month = today.getMonth() + 1;  // 월
            const date = today.getDate();  // 날짜
        
            const s3bucket = new AWS.S3({
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
                region: AWS_REGION
            });
        
            const paramsChrImg = {
                Bucket: AWS_BUCKET_NAME,
                Key: usrIdx + '/' + year + '/' + month + '/' + date + '/' + 'chrImg',
                Body: chrImg,
                ContentType: 'png',
                ACL: 'public-read'
            };
        
            s3bucket.upload(paramsChrImg, async(err, data) => {
                
                const updateUsrChrQuery = `
                UPDATE UsrChr
                SET usrChrImg = ?, usrChrChkIdx = ?, usrChrExpFirIdx = ?, usrChrExpSecIdx = ?, usrChrBgIdx = ?
                WHERE usrChrIdx = ?
                `;
        
                //Query Value
                const usrChrImg = AWS_Uploaded_File_URL_LINK + '/' + usrIdx + '/' + year + '/' + month + '/' + date + '/' + 'chrImg';
            
                //Query Result  
                const updateUsrChrResult = await db.queryParam_Arr(updateUsrChrQuery, [usrChrImg, usrChrChkIdx, usrChrExpFirIdx, usrChrExpSecIdx, usrChrBgIdx, usrChrIdx]);
        
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_CREATE_COMMENT));
            });
        }
    } 
});

/*
캐릭터 코멘트 수정
METHOD       : PUT
URL          : /character/:usrChrIdx/comment
PARAMETER    : usrChrIdx = 사용자 캐릭터 인덱스
BODY         : usrChrCmtIdx = 칭찬 인덱스
               comment = 칭찬 내용
               tag = 태그 내용(배열)
HEADERS      : token = 사용자 토큰
*/

router.put('/:usrChrIdx/comment', authUtil, async(req, res) => {
    
    /* 1. UsrChrCmt 테이블에 칭찬 수정 */
    const updateUsrChrCmtQuery = `
    UPDATE UsrChrCmt
    SET usrChrCmt = ?
    WHERE usrChrCmtIdx = ?
    `;

    //Query Value
    const usrChrCmt = req.body.comment;
    const usrChrCmtIdx = req.body.usrChrCmtIdx;

    //Query Result
    const updateUsrChrCmtResult = await db.queryParam_Arr(updateUsrChrCmtQuery, [usrChrCmt, usrChrCmtIdx]);   

    /* 2. UsrChrCmtTag 테이블에 있는 기존 태그 삭제 */
    const deleteUsrChrCmtTagQuery = `
    DELETE
    FROM UsrChrCmtTag
    WHERE usrChrCmtIdx = ?;
    `;

    //Query Result
    const deleteUsrChrCmtTagResult = await db.queryParam_Arr(deleteUsrChrCmtTagQuery, [usrChrCmtIdx]); 

    /* 3. UsrChrCmtTag 테이블에 새로운 태그 생성 */
    const insertUsrChrCmtTagQuery = `
    INSERT 
    INTO UsrChrCmtTag(usrChrCmtIdx, usrChrCmtTag) 
    VALUES (?, ?)
    `;

    const tags = req.body.tag;
    for(let i = 0; i<tags.length; i++){
        //Query Value
        const usrChrCmtTag = tags[i];
        
        //Query Result
        const insertUsrChrCmtTagResult = await db.queryParam_Arr(insertUsrChrCmtTagQuery, [usrChrCmtIdx, usrChrCmtTag]); 
    }

    res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_UPDATE_COMMENT));
});

/*
캐릭터 코멘트 삭제
METHOD       : DELETE
URL          : /character/:usrChrIdx/comment
PARAMETER    : usrChrIdx = 사용자 캐릭터 인덱스
BODY         : usrChrCmtIdx = 칭찬 인덱스
HEADERS      : token = 사용자 토큰
*/

router.delete('/:usrChrIdx/comment', authUtil, async(req, res) => {
    
    const usrIdx = req.decoded.usrIdx;

    /* 1. UsrChrCmt 테이블에 칭찬 삭제 */
    const deleteUsrChrCmtQuery = `
    DELETE
    FROM UsrChrCmt
    WHERE usrChrCmtIdx = ?;
    `;

    //Query Value
    const usrChrCmtIdx = req.body.usrChrCmtIdx;

    //Query Result
    const deleteUsrChrCmtResult = await db.queryParam_Arr(deleteUsrChrCmtQuery, [usrChrCmtIdx]);   

    /* 2. UsrChr 테이블에서 usrChrLv(-1), usrChrBaseImg 찾기 */
    const selectUsrChrQuery = `
    SELECT usrChrLv, usrChrBaseImg, usrChrChkIdx, usrChrExpFirIdx, usrChrExpSecIdx, usrChrBgIdx
    FROM UsrChr
    WHERE usrChrIdx = ?
    `;

    //Query Value
    const usrChrIdx = req.params.usrChrIdx;

    //Query Result
    const selectUsrChrResult = await db.queryParam_Arr(selectUsrChrQuery, [usrChrIdx]);  

    //결과
    const usrChrLv = selectUsrChrResult[0].usrChrLv - 1;

    const updateUsrChrQuery = `
    UPDATE UsrChr
    SET usrChrLv = ?
    WHERE usrChrIdx = ?
    `;

    //Query Result  
    const updateUsrChrResult = await db.queryParam_Arr(updateUsrChrQuery, [usrChrLv, usrChrIdx]);

    if(usrChrLv >= 5){
        res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_DELETE_COMMENT));
    }
    else {
        const selectUsrDtlQuery = `
        SELECT usrChrLove
        FROM UsrDtl
        WHERE usrIdx = ?
        `;

        //Query Result  
        const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);

        let usrChrLove = selectUsrDtlResult[0].usrChrLove - 0.2;

        if(usrChrLove < 0){
            usrChrLove = 0
        } 

        const updateUsrDtlQuery = `
        UPDATE UsrDtl
        SET usrChrLove = ?
        WHERE usrIdx = ?
        `;
    
        //Query Result  
        const updateUsrDtlResult = await db.queryParam_Arr(updateUsrDtlQuery, [usrChrLove, usrIdx]);

        if(usrChrLv == 4){
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_DELETE_COMMENT));
        }
        else {
            let images = [];
            const usrChrBaseImg = selectUsrChrResult[0].usrChrBaseImg;
        
            /* 4. 레벨에 맞는 이전 배경, 효과, 표정으로 돌아가기 */
    
            /* 
            1. 0레벨일때 => 베이스 이미지에 기본표정
            2. 1레벨일때 => 베이스 이미지에 기본표정이랑 연지곤지
            3. 2레벨일떄 => 베이스 이미지에 연지곤지랑 1레벨 표정
            4. 3레벨일때 => 베이스 이미지에 연지곤지랑 2레벨 표정
            */  
           
            let usrChrChkIdx = selectUsrChrResult[0].usrChrChkIdx;
            let usrChrExpFirIdx = selectUsrChrResult[0].usrChrExpFirIdx;
            let usrChrExpSecIdx = selectUsrChrResult[0].usrChrExpSecIdx;
            let usrChrBgIdx = selectUsrChrResult[0].usrChrBgIdx;

            if(usrChrLv == 0){
                //베이스 이미지
                images.push(usrChrBaseImg);
                
                //기본 표정
                const selectChrExpQuery = `
                SELECT chrExpImg
                FROM ChrExp
                WHERE chrExpLv = 0
                `;
    
                const selectChrExpResult = await db.queryParam_None(selectChrExpQuery);
                images.push(selectChrExpResult[0].chrExpImg);
            }
            else if(usrChrLv == 1){
                //베이스 이미지
                images.push(usrChrBaseImg);

                //기본표정
                const selectChrExpQuery = `
                SELECT chrExpImg
                FROM ChrExp
                WHERE chrExpLv = 0
                `;
    
                const selectChrExpResult = await db.queryParam_None(selectChrExpQuery);
                images.push(selectChrExpResult[0].chrExpImg);

                //연지곤지
                const selectChrChkQuery = `
                SELECT chrChkImg
                FROM ChrChk
                WHERE chrChkIdx = ${usrChrChkIdx}
                `;

                const selectChrChkResult = await db.queryParam_None(selectChrChkQuery);
                images.push(selectChrChkResult[0].chrChkImg);
            }
            else if(usrChrLv == 2){
                //베이스 이미지
                images.push(usrChrBaseImg);

                //1레벨 표정
                const selectChrExpQuery = `
                SELECT chrExpImg
                FROM ChrExp
                WHERE chrExpIdx = ${usrChrExpFirIdx}
                `;

                const selectChrExpResult = await db.queryParam_None(selectChrExpQuery);
                images.push(selectChrExpResult[0].chrExpImg);

                //연지곤지
                const selectChrChkQuery = `
                SELECT chrChkImg
                FROM ChrChk
                WHERE chrChkIdx = ${usrChrChkIdx}
                `;

                const selectChrChkResult = await db.queryParam_None(selectChrChkQuery);
                images.push(selectChrChkResult[0].chrChkImg);
            }
            else{
                //베이스 이미지
                images.push(usrChrBaseImg);

                //2레벨 표정
                const selectChrExpQuery = `
                SELECT chrExpImg
                FROM ChrExp
                WHERE chrExpIdx = ${usrChrExpSecIdx}
                `;

                const selectChrExpResult = await db.queryParam_None(selectChrExpQuery);
                images.push(selectChrExpResult[0].chrExpImg);

                ///연지곤지
                const selectChrChkQuery = `
                SELECT chrChkImg
                FROM ChrChk
                WHERE chrChkIdx = ${usrChrChkIdx}
                `;

                const selectChrChkResult = await db.queryParam_None(selectChrChkQuery);
                images.push(selectChrChkResult[0].chrChkImg);
            }

            /* 4. 이미지 합성 후, UsrChr 테이블에 해당 사용자 캐릭터이미지 수정 */
            //이미지 합성
            for(let i = 0; i<images.length; i++){
                images[i] = await jimp.read(images[i]);
            }

            let img = images[0];
            for(let i = 1; i<images.length; i++){
                img.composite(images[i], 0, 0);
            }
            const chrImg = await img.getBufferAsync(jimp.AUTO);

            const AWS_BUCKET_NAME = s3config.AWS_BUCKET_NAME;
            const AWS_ACCESS_KEY_ID = s3config.AWS_ACCESS_KEY_ID;
            const AWS_SECRET_ACCESS_KEY = s3config.AWS_SECRET_ACCESS_KEY;
            const AWS_REGION = s3config.AWS_REGION;
            const AWS_Uploaded_File_URL_LINK = s3config.AWS_Uploaded_File_URL_LINK;

            const today = new Date();   
            const year = today.getFullYear(); // 년도
            const month = today.getMonth() + 1;  // 월
            const date = today.getDate();  // 날짜

            const s3bucket = new AWS.S3({
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
                region: AWS_REGION
            });

            const paramsChrImg = {
                Bucket: AWS_BUCKET_NAME,
                Key: usrIdx + '/' + year + '/' + month + '/' + date + '/' + 'chrImg',
                Body: chrImg,
                ContentType: 'png',
                ACL: 'public-read'
            };

            s3bucket.upload(paramsChrImg, async(err, data) => {
                
                const updateUsrChrQuery = `
                UPDATE UsrChr
                SET usrChrImg = ?
                WHERE usrChrIdx = ?
                `;

                //Query Value
                const usrChrImg = AWS_Uploaded_File_URL_LINK + '/' + usrIdx + '/' + year + '/' + month + '/' + date + '/' + 'chrImg';
            
                //Query Result  
                const updateUsrChrResult = await db.queryParam_Arr(updateUsrChrQuery, [usrChrImg, usrChrIdx]);

                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_DELETE_COMMENT));
            }); 
        }
    }
});

module.exports = router;