import config from '../../../shared/config/index.js';
import AppError from '../../../shared/utils/AppError.js'
import logger from '../../../shared/config/logger.js'
import jwt from 'jsonwebtoken'
export default class AuthService {
    constructor(userRepository) {
        if (!userRepository) throw new Error('userRepository is required')

        this.userRepository = userRepository
    }

    async generateToken(user) {
        const { _id, email, username, role, clientId } = user;
        const payload = {
            userId: _id,
            email,
            username, role,
            clientId
        }

        return jwt.sign(payload, config.jwt.secret, config.jwt.expiresIn)
    }

    formatUserForResponse(user) {
        const userObj = userObj.toObject ? userObj.toObject() : { ...user }
        delete userObj.password
        return userObj
    }

    async onboardSuperadmin(superAdminData) {
        try {
            const existingUser = new this.userRepository.findAll();
            if (existingUser && existingUser.length > 0) {
                throw new AppError('Super admin onboarding is disable', 403)
            }
            const user = new this.userRepository.create(superAdminData)
            const token = this.generateToken(user)
            logger.info('Admin onboarded. ', { username: user.username })
            return { user: this.formatUserForResponse(user), token }
        } catch (error) {
            logger.info('Admin onboarded Error ', error)
            throw error
        }
    }
}