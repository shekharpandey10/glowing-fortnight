import logger from "../../../shared/config/logger.js"
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js"

class ClientController {
    constructor(clientService, authService) {
        if (!clientService) {
            throw new Error('Client service is required')
        }
        if (!authService) {
            throw new Error('Auth service is required')
        }

        this.clientService = clientService
        this.authService = authService
    }

    async createClient(req, res, next) {
        try {
            const isSuperAdmin = await this.authService.checkSuperAdminPermissions(req.user.userId)
            if (!isSuperAdmin) {
                return res.status(403).json(ResponseFormatter.error("Access denied", 403))
            }
            const clientData = req.body;
            const adminUser = req.user
            if (!adminUser) {
                logger.error("Admin is not defined")

                return res.status(403).json(ResponseFormatter.error({}, "Admin is not defined", 403))
            }


            const client = await this.clientService.createClient(clientData, adminUser)
            logger.info("Client created successfully")
            return res.status(201).json(ResponseFormatter.success(client, "Client created successfully", 201))

        } catch (error) {
            next(error);
            logger.error('Error while creating the client ', error)
        }
    }
    async createClientUser(req, res, next) {
        try {
            console.log(req.body, 'req.bod')
            const clientId = req.params.clientId
            const user = await this.clientService.createClientUser(clientId, req.body, req.user)

            logger.info("Client User created successfully")
            return res.status(201).json(ResponseFormatter.success(user, "Client User created successfully", 201))

        } catch (error) {
            next(error);
            logger.error('Error while creating the client user ', error)
        }
    }

    async createApiKey(req, res, next) {
        try {
            const clientId = req.params.clientId;
            const apiKey = await this.clientService.createApiKey(clientId, req.body, req.user)

            logger.info("Client Api-key created successfully")
            return res.status(201).json(ResponseFormatter.success(apiKey, "Client Api key created successfully", 201))
        } catch (error) {
            next(error);
            logger.error('Error while creating the client api-key ', error)
        }
    }


    async getAllApiKeys(req, res, next) {
        try {
            const clientId = req.params.clientId;
            const apiKeys = await this.clientService.getAllApiKeys(clientId, req.user)

            return res.status(200).json(ResponseFormatter.success(apiKeys, "Client Api key fetched successfully", 200))
        } catch (error) {
            next(error);
            logger.error('Error while fetching the client api-keys ', error)
        }
    }

}

export default ClientController
