import logger from "../../../shared/config/logger.js"
import { APPLICATION_ROLES, isValidClientRole } from "../../../shared/constants/roles.js"
import AppError from "../../../shared/utils/AppError.js"


class ClientService {
    constructor(dependencies) {
        if (!dependencies) {
            throw new Error('Dependencies are required')
        }

        if (!dependencies.clientRepository) {
            throw new Error('ClientRepository is required')
        }
        if (!dependencies.apiKeyRepository) {
            throw new Error('ApiKeyRepository is required')
        }
        if (!dependencies.userRepository) {
            throw new Error('UserRepository is required')
        }

        this.ClientRepository = dependencies.clientRepository
        this.ApiKeyRepository = dependencies.apiKeyRepository
        this.UserRepository = dependencies.userRepository
    }


    formatClientForResponse(user) {
        const userObj = user.toObject ? user.toObject() : { ...user }
        delete userObj.password
        return userObj
    }

    /**
     * 
     * @param {String} name 
     * @returns {String}
     */

    generateSlug(name) { //amazon web services = amazon-web-services
        return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
    }

    canUserAccessClient(adminUser, clientId) {
        if (adminUser.role === APPLICATION_ROLES.SUPER_ADMIN) return true

        return adminUser.clientId && adminUser.clientId.toString() === clientId.toString()
    }


    async createClient(clientData, adminUser) {
        try {
            const { name, email, description, website = null } = clientData

            const slug = this.generateSlug(name)

            const existingClient = await this.ClientRepository.findBySlug(slug)

            if (existingClient) {
                throw new AppError(slug, ' Slug is already exists', 400)
            }

            const client = await this.ClientRepository.create({ name, slug, email, description, website, createdBy: adminUser.userId })

            return client
        } catch (error) {
            logger.error('Error while create client ', error)
            throw error
        }
    }

    async createClientUser(clientId, clientUserData, adminUser) {
        try {
            if (!this.canUserAccessClient(adminUser, clientId)) {
                logger.error("doesn't have the access")
                throw new AppError("Access denied", 403)
            }
            let { username, email, password, role = APPLICATION_ROLES.CLIENT_VIEWER } = clientUserData

            if (!isValidClientRole(role)) {
                throw new AppError("Give valid role, Access denied", 400)
            }
            const client = await this.ClientRepository.findById(clientId)
            if (!client) {
                throw new AppError("Client not found", 404)
            }

            let permissions = {
                canCreateApiKey: false,
                canManageUsers: false,
                canViewAnalytics: true,
                canExportData: false
            }

            if (role = APPLICATION_ROLES.CLIENT_ADMIN) {
                permissions = {
                    canCreateApiKey: true,
                    canManageUsers: true,
                    canViewAnalytics: true,
                    canExportData: true
                }
            }

            const userData = {
                username, email, password, role,
                permissions, clientId
            }

            const user = await this.UserRepository.create(userData)
            logger.info('client user created successfully ', user)
            return this.formatClientForResponse(user)
        } catch (error) {
            logger.error('error while client user creation ', error)
            throw error
        }
    }
}

export default ClientService