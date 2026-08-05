import createEventProducer from '../../../shared/events/producer/CreateEventProducer.js'
import logger from '../../../shared/config/logger.js'
import { IngestController } from '../controller/ingestController.js'
import { IngestService } from '../services/ingestService.js'

class Container {
    constructor() {

    }
    static init() {
        logger.info('[IngestDependencies] initializing dependencies')

        try {
            const eventProducer = createEventProducer()

            const services = {
                ingestService: new IngestService({ eventProducer })
            }

            const controller = {
                ingestController: new IngestController(services.ingestService)
            }

            logger.info('[IngestDependencies] initialized successfully')
            return { services, controller }
        } catch (error) {
            logger.error('[IngestDependencies] initialization failed', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
            })
            throw error
        }
    }
}


const container = Container.init()
export default {
    ingestService: container.services.ingestService,
    ingestController: container.controller.ingestController,
    Container
}
