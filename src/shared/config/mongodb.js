import mongoose from "mongoose";
import config from './index.js'
import logger from "./logger.js";

/**
 * config mongo db
 * using singalton design pattern
 */
class MongoConnection {
    constructor() {
        this.connection = null
    }

    /**
     * Connect to mongoDb
     * @returns {Promise<mongoose.Connection>}
     */
    async connect() {
        try {
            if (this.connection) {
                logger.info('MongoDb is already connected')
                return this.connection;
            }

            await mongoose.connect(config.mongo.uri, {
                dbName: config.mongo.dbName
            })
            this.connection = mongoose.connection
            logger.info(`MongoDb connected ${config.mongo.uri}`)
            this.connection.on("error", (err) => {
                logger.error(`MongoDb connection Error ${err}`)
            })
            this.connection.on('disconnected', () => {
                console.log('mongoDb disconnected')
            })
            return this.connection
        } catch (error) {
            logger.error('Failed to connect mongoDb ', error)
            throw error
        }
    }

    /**
     *  Disconnect to mongoDb 
     * 
     */
    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.disconnect();
                this.connection = null;
                logger.info('mongoDb disconnected')
            }

        } catch (error) {
            logger.error('Failed to disconnect mongoDb ', error)
            throw error
        }

    }

    /**
     * return the mongodb active connection
     * @returns {mongoose.Connection}
     */
    getCurrentConnection() {
        return this.connection
    }
}

export default new MongoConnection