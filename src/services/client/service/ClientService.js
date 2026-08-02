import logger from "../../../shared/config/logger.js"
import { APPLICATION_ROLES, isValidClientRole } from "../../../shared/constants/roles.js"
import AppError from "../../../shared/utils/AppError.js"
import { v4 as uuidv4 } from 'uuid'
import { randomBytes } from 'node:crypto';


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

    generateApiKey(keyId) {
        const prefix = 'apim'
        const random = randomBytes(20).toString('hex')
        return `${prefix}_${random}`
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

            const client = await this.ClientRepository.findById(clientId)
            if (!client) {
                throw new AppError("Client not found", 404)
            }
            if (!this.canUserAccessClient(adminUser, clientId)) {
                logger.error("doesn't have the access")
                throw new AppError("Access denied", 403)
            }
            let { username, email, password, role = APPLICATION_ROLES.CLIENT_VIEWER } = clientUserData

            if (!isValidClientRole(role)) {
                throw new AppError("Give valid role, Access denied", 400)
            }


            let permissions = {
                canCreateApiKey: false,
                canManageUsers: false,
                canViewAnalytics: true,
                canExportData: false
            }

            if (role === APPLICATION_ROLES.CLIENT_ADMIN) {
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
    async createApiKey(clientId, apiKeyPayload, user) {
        try {

            const client = await this.ClientRepository.findById(clientId)
            if (!client) {
                throw new AppError("Client not found", 404)
            }
            if (!this.canUserAccessClient(user, clientId)) {
                logger.error("doesn't have the access")
                throw new AppError("Access denied", 403)
            }

            if (!(user.role === APPLICATION_ROLES.CLIENT_ADMIN || user.role === APPLICATION_ROLES.SUPER_ADMIN)) {
                throw new AppError('Access denied- only super admin and client admin can create Api keys', 403)   //here either it is client viewer or unauthorize.
            }



            const { name, description, environment = process.env.NODE_ENV || 'production' } = apiKeyPayload
            const keyId = uuidv4();
            const keyValue = this.generateApiKey(keyId)
            const apiKeyData = {
                name,
                description,
                environment,
                clientId,
                keyId,
                keyValue,
                createdBy: user.userId
            }
            const apikey = await this.ApiKeyRepository.create(apiKeyData)
            logger.info('Api key created successfully for  ', user.userId)
            return apikey
        } catch (error) {
            logger.error('error while client user creation ', error)
            throw error
        }
    }


    async getAllApiKeys(clientId, user) {
        try {
            const client = await this.ClientRepository.findById(clientId)
            if (!client) {
                throw new AppError("Client not found", 404)
            }

            const apiKeys = await this.ApiKeyRepository.findByClientId(clientId)

            const formattedResponse = apiKeys.map((key) => {
                const keyObj = key.toObject ? key.toObject() : key
                delete keyObj.keyValue  //prevent to get the api key value
                return keyObj
            })
            logger.info('Api key fetched successfully for  ', formattedResponse)
            return formattedResponse
        } catch (error) {
            logger.error('error while fetching api keys  ', error)
            throw error
        }
    }

    async getClientByApiKey(apiKey,) {
        try {
            const key = await this.ApiKeyRepository.findByKeyValue(apiKey);
            if (!key) {
                return null;
            }

            if (key.isExpired()) {
                return null;
            }
            const client = key.clientId;

            return {
                client,
                apiKey: key,
            };
        } catch (error) {
            logger.error('Error finding client by API key:', error);
            throw error;
        }
    }
}

export default ClientService
