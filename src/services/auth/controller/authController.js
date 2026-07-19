import config from "../../../shared/config/index.js"
import logger from "../../../shared/config/logger.js"
import { APPLICATION_ROLES } from "../../../shared/constants/roles.js"
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js"

class AuthController {
    constructor(authService) {
        if (!authService) throw new Error('authService is required')
        this.authService = authService
    }

    async onboardSuperadmin(req, res, next) {
        try {
            const { username, email, password } = req.body
            const superAdminData = {
                username,
                email,
                password,
                role: APPLICATION_ROLES.SUPER_ADMIN
            }

            const { user, token } = await this.authService.onboardSuperadmin(superAdminData)

            res.cookie('authToken', token, {
                http: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            })

            res.status(200).json(ResponseFormatter.success(user, 'SuperAdmin Created Successfully', 201))
        } catch (error) {
            logger.error(`Failed to create Super admin `, error)
            next(error)
        }
    }
}

export default AuthController