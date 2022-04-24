const formatDate = (date) => {
 
    const year = date.getFullYear(); // 년도
    const month = date.getMonth() + 1;  // 월
    const day = date.getDate();  // 날짜

    return year + '-' + month + '-' + day;
};

module.exports = formatDate;