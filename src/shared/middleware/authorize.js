import ResponseFormatter from "../utils/ResponseFormatter.js";


const authorize = (allowedRoles = []) => (req, res, next) => {
    try {
        if (!req.user || !req.user.role) {
            return res.status(403).json(ResponseFormatter.error({}, "Forbidden Req", 403))
        }


        if (allowedRoles.length === 0) {   //this is the public route ( not need the role)
            next()
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json(ResponseFormatter.error({}, "Insufficient Permission", 401))
        }
        next()
    } catch (error) {
        return res.status(403).json(ResponseFormatter.error(error, "Forbidden Req", 403))

    }
}

export default authorize