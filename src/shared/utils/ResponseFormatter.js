class ResponseFormatter {

    /**
     * To handle Success response
     * @param {Object|null} data 
     * @param {String} message 
     * @param {Number} statusCode 
     * @returns {Object}
     */
    static success(data = null, message = "Success", statusCode = 200) {
        return {
            success: true,
            data: data,
            message: message,
            statusCode: statusCode,
            timestamp: Date.now().toISOString()
        }
    }

    /**
     * To handle error response
     * @param {Object} error 
     * @param {String} message 
     * @param {Number} statusCode 
     * @returns 
     */
    static error(error = null, message = "Error", statusCode = 500) {
        return {
            success: false,
            error,
            message: message,
            statusCode: statusCode,
            timestamp: Date.now().toISOString()
        }
    }

    /**
     * 
     * @param {Object|null} error 
     * @returns {Object}
     */
    static validationError(error = null) {
        return {
            success: false,
            error,
            message: "Validation failed",
            statusCode: 400,
            timestamp: Date.now().toISOString()
        }
    }

    /**
     * To handle response with paginated data
     * @param {Object|null} data 
     * @param {Number} page 
     * @param {Number} limit 
     * @param {Number} total 
     * @returns  {Object}
     */
    static paginated(data = null, page, limit, total) {
        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            timestamp: Date.now().toISOString()
        }
    }


}

export default ResponseFormatter