import BaseRepository from "./BaseRepository.js";
import User from '../../../shared/models/User.js'
import logger from '../../../shared/config/logger.js'

class UserRepository extends BaseRepository {
    constructor() {
        super(User)
    }


    async create(userData) {
        try {
            let data = { ...userData }

            if (data.role === 'super_admin' && !data.permission) {
                data.permission = {
                    canCreateApiKey: true,
                    canManageUsers: true,
                    canViewAnalytics: true,
                    canExportData: true
                }
            }

            const user = await new this.model(data)
            await user.save()

            logger.info('User created, ', { username: user.name })
            return user
        } catch (error) {
            logger.info('Error User creation ', error)
            throw error
        }
    }


    async findById(userId) {
        try {
            const user = new this.model.findById(userId)
            return user
        } catch (error) {
            logger.info('Error finding user by userId ', error)
            throw error
        }
    }

    async findByUsername(username) {
        try {
            const user = new this.model.findOne({ username })
            return user
        } catch (error) {
            logger.info('Error finding user by username ', error)
            throw error
        }
    }
    async findByEmail(email) {
        try {
            const user = new this.model.findOne({ email })
            return user
        } catch (error) {
            logger.info('Error finding user by email ', error)
            throw error
        }
    }

    async findAll() {
        try {
            const users = new this.model.findAll({ isActive: true }).select('-password')
            return users
        } catch (error) {
            logger.info('Error finding all users ', error)
            throw error
        }
    }
}


export default UserRepository