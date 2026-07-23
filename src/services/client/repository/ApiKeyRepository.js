import ApiKey from "../../../shared/models/ApiKey.js";
import ApiKeyBaseRepository from "./ApiKeyBaseRepository.js";



class ApiKeyRepository extends ApiKeyBaseRepository {
    constructor() {
        super(ApiKey)
    }


    /**
     * 
     * @param {Object} apiKeyData 
     * @returns {Promise<Object>}
     */
    async create(apiKeyData) {
        try {
            const apiKey = new this.model(apiKeyData);
            await apiKey.save();
            logger.info('API key created in database', { keyId: apiKey.keyId });
            return apiKey;
        } catch (error) {
            logger.error('Error creating API key in database:', error);
            throw error;
        }
    }

    /**
     * 
     * @param {Object} keyValue 
     * @param {Object} includeInactive 
     * @returns {Promise<Object|null>}
     */
    async findByKeyValue(keyValue, includeInactive = false) {
        try {
            const filter = { keyValue };
            if (!includeInactive) {
                filter.isActive = true;
            }

            const apiKey = await this.model.findOne(filter).populate('clientId');
            return apiKey;
        } catch (error) {
            logger.error('Error finding API key by value:', error);
            throw error;
        }
    }



    /**
     * 
     * @param {Number|string} clientId 
     * @param {Object|null} filters 
     * @returns {Promise<Object|null>}
     */
    async findByClientId(clientId, filters = {}) {
        try {
            const query = { clientId, ...filters };
            const apiKeys = await this.model.find(query)
                .populate('createdBy', 'username email')
                .sort({ createdAt: -1 });

            return apiKeys;
        } catch (error) {
            logger.error('Error finding API keys by client ID:', error);
            throw error;
        }
    }

    /**
     * 
     * @param {Number} clientId 
     * @param {Object} filters 
     * @returns {Promise<Number>}
     */
    async countByClientId(clientId, filters = {}) {
        try {
            const query = { clientId, ...filters };
            const count = await this.model.countDocuments(query);
            return count;
        } catch (error) {
            logger.error('Error counting API keys:', error);
            throw error;
        }
    }

}


export default new ApiKeyRepository()