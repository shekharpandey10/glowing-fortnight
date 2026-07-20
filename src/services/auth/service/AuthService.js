import config from '../../../shared/config/index.js';
import AppError from '../../../shared/utils/AppError.js'
import logger from '../../../shared/config/logger.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
export default class AuthService {
    constructor(userRepository) {
        if (!userRepository) throw new Error('userRepository is required')

        this.userRepository = userRepository
    }

    generateToken(user) {
        const { _id, email, username, role, clientId } = user;
        const payload = {
            userId: _id,
            email,
            username, role,
            clientId
        }

        return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
    }

    async comparePassword(password, hashPass) {
        return await bcrypt.compare(password, hashPass)
    }
    formatUserForResponse(user) {
        const userObj = user.toObject ? user.toObject() : { ...user }
        delete userObj.password
        return userObj
    }

    async onboardSuperadmin(superAdminData) {
        try {
            const existingUser = await this.userRepository.findAll();
            if (existingUser && existingUser.length > 0) {
                throw new AppError('Super admin onboarding is disable', 403)
            }
            const user = await this.userRepository.create(superAdminData)
            const token = this.generateToken(user)
            logger.info('Admin onboarded. ', { username: user.username })
            return { user: this.formatUserForResponse(user), token }
        } catch (error) {
            logger.info('Admin onboarded Error ', error)
            throw error
        }
    }

    async register(userData) {
        try {
            const existingUser = await this.userRepository.findByUsername(userData.username)
            if (existingUser) {
                throw new AppError('User is already exists', 409)
            }
            const existingEmail = await this.userRepository.findByEmail(userData.email)
            if (existingEmail) {
                throw new AppError('User Email is already exists', 409)
            }

            const user = await this.userRepository.create(userData)
            const token = this.generateToken(user)

            logger.info('User Registered successfully. ', { username: user.username })
            return { user: this.formatUserForResponse(user), token }
        } catch (error) {
            logger.info('User register Error ', error)
            throw error
        }
    }

    async login(userData) {
        try {
            const { username, password } = userData
            const user = await this.userRepository.findByUsername(username);
            if (!user) {
                throw new AppError('Invalid credentials', 401)
            }

            if (!user.isActive) {
                throw new AppError('Account is deactivated', 403)
            }

            const isPasswordValid = await this.comparePassword(password, user.password)
            if (!isPasswordValid) {
                throw new AppError('Invalid credentials', 401)
            }

            const token = this.generateToken(user)

            logger.info('user loggedin successfully. ', { username: user.username })

            return {
                user: this.formatUserForResponse(user),
                token
            }
        } catch (error) {
            logger.info('User login Error ', error)
            throw error
        }
    }
}
