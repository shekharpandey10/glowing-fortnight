

/**
 * Base repository
 * Database-agnostic repository contract
 * concrete repositories should extends this class and implement/override database-specific methods.
 */

export default class BaseRepository {
    constructor({ logger: l = console } = {}) {
        this.logger = l
    }


    async save() {
        throw new Error("Method is not implemented: save")
    }
    async find() {
        throw new Error("Method is not implemented: find")
    }
    async count() {
        throw new Error("Method is not implemented: count")
    }
    async deleteOldHits() {
        throw new Error("Method is not implemented: deleteOldHits")
    }
}