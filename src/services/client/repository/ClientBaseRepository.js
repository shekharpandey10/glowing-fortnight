

class ClientBaseRepository {

    constructor(model) {
        this.model = model
    }


    async create(clientData) {
        throw new Error('Method not implemented.')
    }
    async findById(clientId) {
        throw new Error('Method not implemented.')
    }
    async findbySlug(slug) {
        throw new Error('Method not implemented.')
    }
    async find(filter, options) {
        throw new Error('Method not implemented.')
    }
    async count(filter) {
        throw new Error('Method not implemented.')
    }

}
export default ClientBaseRepository