const resMessage = require('./responseMessage');
const statusCode = require('./statusCode');
const util = require('./utils');
const db = require('../pool');

const hasMadeUserDetail = async (req, res, next) => {
    const usrIdx = req.decoded.usrIdx;

    const selectUsrDtlQuery = 'SELECT * FROM UsrDtl WHERE usrIdx = ?';
    const selectUsrDtlResult = await db.queryParam_Arr(selectUsrDtlQuery, [usrIdx]);

    //사용자 상세정보를 만들지 않은 사용자일 경우
    if (selectUsrDtlResult.length == 0){
        res.status(403).json(util.successFalse(statusCode.FORBIDDEN, resMessage.NO_USER_DETAIL));
    }
    else {
        next();
    }
};

module.exports = hasMadeUserDetail;