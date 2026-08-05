import BaseRepository from "./BaseRepository";


export class ApiHitRepository extends BaseRepository {
    constructor({ model, logger: l } = {}) {
        super({ logger: l })
        if (!model) throw new Error('ApiHitRepository requires mongoos model')
        this.model = model
    }

    async save(eventData) {
        try {
            const doc = new this.model(eventData)
            await doc.save()


            this.logger.info('API saved to mongodb', { eventId: eventData.eventId })
            return doc
        } catch (error) {
            if (error && error.code === 11000) {
                this.logger.warn('Duplicate Event id, skipping save', { eventId: eventData.eventId })
                return null
            }
            this.logger.error("Error saving api hits", error)
            throw error
        }
    }

    async find(filter = {}, options = {}) {
        try {
            const { limit = 100, skip = 0, sort = { timestamp: -1 } } = options
            const hit = await this.model.find(filter).sort(sort).limit(limit).skip(skip).lean() //lean use for return the js object not the whole docs of mongodb
            return hit
        } catch (error) {
            this.logger.error("Error finding api hits", error)
            throw error
        }
    }
    async count(filter = {}) {
        try {
            const count = await this.model.countDocuments(filter)
            return count
        } catch (error) {
            this.logger.error("Error counting api hits", error)
            throw error
        }
    }
    async deleteOldHits(beforeData) {
        try {
            const result = await this.model.deleteMany({ timestamp: { $lt: beforeData } })
            this.logger.info('Deleted old api hits ', { count: result.deletedCount })
            return result.deletedCount
        } catch (error) {
            this.logger.error("Error deleting old api hits", error)
            throw error
        }
    }
}