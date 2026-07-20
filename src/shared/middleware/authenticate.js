import jwt from "jsonwebtoken"
import ResponseFormatter from "../utils/ResponseFormatter.js"
import config from "../config/index.js"
import logger from "../config/logger.js"


const authenticate = async (req, res, next) => {
    try {
        let token = null
        if (req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken
            if (!token) {
                return res.status(400).json(ResponseFormatter.error({}, 'Authentication token is required', 401))
            }
        }

        const decoded = jwt.verify(token, config.jwt.secret)
        const { userId, email, username, role, clientid } = decoded
        req.user = {
            userId, email, username, role, clientid
        }
        next()
    } catch (error) {
        logger.error('Authentication Failed ', {
            error: error.message,
            path: req.path
        })

        if (error.name === "TokenExpiredError") {
            return res.status(401).json(ResponseFormatter.error({}, "token expired", 401))
        }
        return res.status(400).json(ResponseFormatter.error(error, 'Invalid token', 401))
    }

}
export default authenticate