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

/*
사용자 상세정보 생성
METHOD       : POST
URL          : /userDetail
BODY         : name = 캐릭터 이름
               shape = 캐릭터 모양
               color = 캐릭터 색깔
               feature = 캐릭터 특징(없을 경우 : 0)
HEADERS      : token = 사용자 토큰
*/

router.post('/', authUtil, async(req, res) => {
    
    let images = [];

    /* 1. ChrShpClr 테이블에서 모양+색 이미지 받기 */
    //ChrShpClr 테이블 SELECT
    const selectChrShpClrQuery = `
    SELECT chrShpClrImg
    FROM ChrShpClr
    WHERE chrShp = ? AND chrClr = ?
    `;

    //Query Value
    const chrShp = req.body.shape;
    const chrClr = req.body.color;

    //Query Result
    const selectChrShpClrResult = await db.queryParam_Arr(selectChrShpClrQuery, [chrShp, chrClr]);   

    //이미지 push
    images.push(selectChrShpClrResult[0].chrShpClrImg);

    /* 2. ChrFt 테이블에서 캐릭터 특징 이미지 받기 */
    //ChrFt 테이블 SELECT
    let chrFtIdx = req.body.feature;
    
    chrFtIdx = (chrFtIdx == 0) ? null : chrFtIdx;

    if(chrFtIdx != null){
        const selectChrFtQuery = `
        SELECT chrFtImg
        FROM ChrFt
        WHERE chrFtIdx = ?
        `;
    
        //Query Result
        const selectChrFtResult = await db.queryParam_Arr(selectChrFtQuery, [chrFtIdx]);
    
        //이미지 push
        images.push(selectChrFtResult[0].chrFtImg);
    }

    /* 3. ChrExp 테이블에서 캐릭터 표정 이미지 받기 */
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

    let img = images[0];
    for(let i = 1; i<images.length; i++){
        img.composite(images[i], 0, 0);
    }
    const chrImgDft = await img.getBufferAsync(jimp.AUTO);

    /* 5. 이미지 s3에 넣기 */
    const AWS_BUCKET_NAME = s3config.AWS_BUCKET_NAME;
    const AWS_ACCESS_KEY_ID = s3config.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = s3config.AWS_SECRET_ACCESS_KEY;
    const AWS_REGION = s3config.AWS_REGION;
    const AWS_Uploaded_File_URL_LINK = s3config.AWS_Uploaded_File_URL_LINK;

    const s3bucket = new AWS.S3({
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        region: AWS_REGION
    });

    const usrIdx = req.decoded.usrIdx;
    const paramsChrImgDft = {
        Bucket: AWS_BUCKET_NAME,
        Key: usrIdx + '/' + 'chrImgDft',
        Body: chrImgDft,
        ContentType: 'png',
        ACL: 'public-read'
    };

    s3bucket.upload(paramsChrImgDft, async(err, data) => {
        
        const insertUsrDtlQuery = `
        INSERT 
        INTO UsrDtl (usrIdx, usrChrName, usrChrShp, usrChrFtIdx,  usrChrLove, usrChrLastCrt, usrChrImgDft) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const usrChrName = req.body.name;
        const usrChrShp = chrShp;
        const usrChrFtIdx = chrFtIdx;
        const usrChrLove = 0;
        const usrChrLastCrt = formatDate(new Date());
        const usrChrImgDft = AWS_Uploaded_File_URL_LINK + '/' + usrIdx + '/' + 'chrImgDft';
    
        const insertUsrDtlResult = await db.queryParam_Arr(insertUsrDtlQuery, [usrIdx, usrChrName, usrChrShp, usrChrFtIdx, usrChrLove, usrChrLastCrt, usrChrImgDft]);

        let resData = {};
        resData.usrChrImgDft = usrChrImgDft;
    
        if (Object.keys(insertUsrDtlResult).length == 0) {
            res.status(500).send(defaultRes.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.FAIL_CREATE_USERDETAIL));
        } else { 
            res.status(200).send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_CREATE_USERDETAIL, resData));
        }
    }); 
});

module.exports = router;