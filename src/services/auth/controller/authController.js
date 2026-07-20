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
            const { username, email, password } = req.body || {}
            const superAdminData = {
                username,
                email,
                password,
                role: APPLICATION_ROLES.SUPER_ADMIN
            }

            const { user, token } = await this.authService.onboardSuperadmin(superAdminData)

            res.cookie('authToken', token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            })

            res.status(200).json(ResponseFormatter.success(user, 'SuperAdmin Created Successfully', 201))
        } catch (error) {
            logger.error(`Failed to create Super admin `, error)
            next(error)
        }
    }


    async register(req, res, next) {
        try {
            const { username, password, email, role } = req.body || {}
            const userData = {
                username,
                email,
                password,
                role: role || APPLICATION_ROLES.CLIENT_VIEWER
            }
            const { token, user } = await this.authService.register(userData);

            res.cookie('authToken', token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            })
            res.status(200).json(ResponseFormatter.success(user, 'User Created Successfully', 201))

        } catch (error) {
            logger.error(`Failed to create User `, error)
            next(error)
        }
    }

    async login(req, res, next) {
        try {
            const { username, password } = req.body || {};
            const userData = { username, password }
            const { user, token } = await this.authService.login(userData)
            res.cookie('authToken', token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.expiresIn
            })
            res.status(200).json(ResponseFormatter.success(user, 'User login Successfully', 201))
        } catch (error) {
            logger.error(`Failed to login User `, error)
            next(error)
        }
    }
}

export default AuthController
