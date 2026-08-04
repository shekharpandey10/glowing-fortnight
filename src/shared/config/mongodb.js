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
            logger.info('MongoDB connected', {
                dbName: config.mongo.dbName,
                hasUri: Boolean(config.mongo.uri),
            })
            this.connection.on("error", (err) => {
                logger.error('MongoDB connection emitted error', {
                    message: err?.message,
                    stack: err?.stack,
                    code: err?.code,
                })
            })
            this.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected')
            })
            return this.connection
        } catch (error) {
            logger.error('Failed to connect MongoDB', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
                dbName: config.mongo.dbName,
                hasUri: Boolean(config.mongo.uri),
            })
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
            logger.error('Failed to disconnect MongoDB', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
            })
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
