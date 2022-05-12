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
Dummy 캐릭터 생성
METHOD       : POST
URL          : /register
BODY         : color = 사용자가 지정한 캐릭터 색
               date = 날짜
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
   
    const day = req.body.date;
    const year = day.substr(0, 4); // 년도
    const month = day.substr(5, 2) * 1;  // 월
    const date = day.substr(8, 2) * 1;  // 날짜

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
            INTO UsrChr(usrIdx, usrChrImg, usrChrClr, usrChrLv, usrChrBaseImg, usrChrDateCrt) 
            VALUES (?, ?, ?, ?, ?, ?)
            `;

            //Query Result
            const insertUsrChrResult = await db.queryParam_Arr(insertUsrChrQuery, [usrIdx, usrChrImg, chrClr, 0, usrChrBaseImg, day]);
            
            //결과 확인
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_DUMMY_CHARACTER)); 
        }); 
    }); 
});

/* *********************** 캐릭터 칭찬 관련 *********************** */
/*
DUMMY 캐릭터 코멘트 생성
METHOD       : POST
URL          : /register/:usrChrIdx/comment
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
    SELECT usrChrLv, usrChrBaseImg, usrChrChkIdx, usrChrExpFirIdx, usrChrExpSecIdx, usrChrBgIdx, usrChrDateCrt
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
        
            const day = selectUsrChrResult[0].usrChrDateCrt;
            const year = day.substr(0, 4); // 년도
            const month = day.substr(5, 2) * 1;  // 월
            const date = day.substr(8, 2) * 1;  // 날짜
        
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
        
                res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_REGISTER_DUMMY_COMMENT));
            });
        }
    } 
});

module.exports = router;