import logger from "../../../shared/config/logger.js"
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
}

export default ClientService