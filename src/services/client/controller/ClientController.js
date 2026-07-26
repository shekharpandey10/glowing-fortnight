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


            const client = await this.clientService(clientData, adminUser)

            return res.status(403).json(ResponseFormatter.success(client, "Client created successfully", 403))


        } catch (error) {

        }
    }

}

export default ClientController