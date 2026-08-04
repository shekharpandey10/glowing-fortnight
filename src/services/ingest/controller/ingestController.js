
import logger from '../../../shared/config/logger.js'
import ResponseFormatter from '../../../shared/utils/ResponseFormatter.js'
export class IngestController {
    constructor(ingetstService) {
        if (!ingetstService) throw new Error("ingest service is required");
        this.ingetstService = ingetstService
    }

    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {*} next 
     */
    async ingestHit(req, res, next) {
        try {
            logger.info('Ingest: client data received', {
                clientId: req.client._id,
                clientName: req.client.name,
                clientKeys: Object.keys(req.client)
            })
            const hitData = {
                ...req.body,
                clientId: req.client._id,
                apiKeyId: req.apiKey._id,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'] || ''
            }

            logger.info('Ingest: hit data prepared', {
                clientId: req.client._id,
                endpoint: hitData.endpoint,
                method: hitData.method
            })

            const result = await this.ingetstService.ingestHitApi(hitData)
            return res.status(202).json(ResponseFormatter.success(result, "Api hit queued for processing", 202))
        } catch (error) {
            logger.error('Ingest: request failed', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
                statusCode: error?.statusCode,
                path: req.path,
                method: req.method,
                clientId: req.client?._id,
                apiKeyId: req.apiKey?._id,
            })
            next(error)
        }
    }
}
