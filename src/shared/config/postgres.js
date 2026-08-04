import pg from "pg";
import config from "./index.js";
import logger from "./logger.js";


const { Pool } = pg;

class PostgresConnection {
    constructor() {
        this.pool = null
    }

    getPool() {
        if (!this.pool) {
            this.pool = new Pool({
                host: config.postgres.host,
                port: config.postgres.port,
                database: config.postgres.database,
                user: config.postgres.user,
                password: config.postgres.password,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000
            })
        }
        this.pool.on('error', (error) => {
            logger.error('Unexpected error on idle PG client', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
            })
        })
        logger.info('PG pool ready', {
            host: config.postgres.host,
            port: config.postgres.port,
            database: config.postgres.database,
            user: config.postgres.user,
        })
        return this.pool;
    }

    async testConnection() {
        try {
            const pool = this.getPool()
            const client = await pool.connect()
            const result = await client.query('select NOW()')
            client.release();
            logger.info('PG connected successfully', {
                serverTime: result.rows[0].now,
            })
        } catch (error) {
            logger.error('Failed to connect with PG', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
                host: config.postgres.host,
                port: config.postgres.port,
                database: config.postgres.database,
                user: config.postgres.user,
            })
            throw error
        }
    }

    async query(text, params) {
        const pool = this.getPool()
        const start = Date.now();
        try {
            const result = await pool.query(text, params)
            const duration = Date.now() - start;
            logger.debug('Executed PG query', {
                text,
                duration,
                rowCount: result.rowCount,
            })
            return result
        } catch (error) {
            logger.error('PG query failed', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
                text,
                params,
            })
            throw error
        }
    }


    async close() {
        try {
            if (!this.pool) {
                return;
            }
            await this.pool.end()
            this.pool.on('error', err => {
                logger.error('PG pool emitted error while closing', {
                    message: err?.message,
                    stack: err?.stack,
                    code: err?.code,
                })
            })
            this.pool = null
            logger.info('Pg pool closed')
        } catch (error) {
            logger.error('Error while closing PG connection', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
            })
            throw error
        }
    }
}


export default new PostgresConnection()
