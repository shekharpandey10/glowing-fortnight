import ResponseFormatter from "../utils/ResponseFormatter"

const validate = (schema) => (req, res, next) => {
    if (!schema) {
        return next()
    }
    const errors = []
    const body = req.body || {}

    /**  //payload structure
     * {
     *  username:'shekhar',
     * email:'shekhar@gmail.com'
     * }
     */
    Object.entries(schema).forEach(([field, rule]) => {
        const value = body[field];
        if (rule.require && !value) {
            errors.push(`${field}  is required`)
            return
        }

        if (rule.minLength && typeof value === 'string' && value.length < minLength) {
            errors.push(`${field}  nust be at least ${rule.minLength}  length`)
        }

        if (rule.custom && typeof rule.custom === 'function') {
            const customErr = rule.custom(value, body)
            if (customErr) errors.push(customErr)
        }

    })

    if (errors.length > 0) {
        return res.status(400).json(ResponseFormatter.error(errors, 'Validation failed', 400))
    }
}

export default validate