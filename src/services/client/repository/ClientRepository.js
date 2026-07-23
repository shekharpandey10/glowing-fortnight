import ClientBaseRepository from "./ClientBaseRepository";
import Client from '../../../shared/models/Client.js'
import logger from "../../../shared/config/logger.js";

class ClientRepository extends ClientBaseRepository {

    constructor() {
        super(client)

    }

    /**
     *  Create a new client
     * @param {Object} clientData 
     * @returns {Promise<Object>}
     */

    async create(clientData) {
        try {
            const client = await new this.model(clientData)
            await client.save()

            logger.info('Client created in mongodb', {
                mongoId: client._id,
                slug: client.slug
            })
            return client
        } catch (error) {
            logger.error('failed to create client in mongodb ', error)
            throw error
        }
    }

    /**
     *  //Find the client by slug (unique string)
     * @param {String} slug 
     * @returns {Promise<Object>}
     */

    async findbySlug(slug) {
        try {
            const client = await new this.model.findbySlug(slug)
            logger.info('Client details from mongodb fetch by slug ', client)

            return client
        } catch (error) {
            logger.error('failed to get client by slug ', error)
            throw error
        }
    }


    /**
     * /Find the client by client id
     * @param {Number|String} clientId 
     * @returns {Promise<Object>}
     */

    async findById(clientId) {
        try {
            const client = await new this.model.findById(clientId)
            logger.info('Client details from mongodb fetch by id ', client)
            return client
        } catch (error) {
            logger.error('failed to get client by id ', error)
            throw error
        }
    }

    /**
     * find client with filter and pagination
     * @param {Object} filter  Query filter
     * @param {Object} options  Query option {limit,skip,sort}
     * @returns {Promise<Object>}
     */
    async find(filter = {}, options = {}) {
        try {
            const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options
            const clients = await new this.model.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-__v');
            logger.info('Clients fetch from mongodb ', clients)
            return clients
        } catch (error) {
            logger.error('failed to get clients ', error)
            throw error
        }
    }


    /**
     * 
     * @param {Object} filter 
     * @returns {Promise<Number>}
     */
    async count(filter) {
        try {
            const count = await new this.model.countDocuments(filter)
            logger.info('Client count from mongodb ', count)
            return count
        } catch (error) {
            logger.error('failed to get clients count', error)
            throw error
        }
    }
}

export default new ClientRepository()