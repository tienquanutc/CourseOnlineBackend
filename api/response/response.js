let errResponse = function (statusCode, message) {
    return {
        meta: {
            error: true,
            status_code: statusCode,
            message: message
        },
        data: {}
    }
};

let messageResponse = function (message) {
    return {
        meta: {
            error: false,
            status_code: 200,
            message: message
        },
        data: {}
    }
};

module.exports = {
    errResponse,
    messageResponse
};