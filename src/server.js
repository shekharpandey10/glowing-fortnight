import dotenv from 'dotenv'
dotenv.config()
import express from "express";
import cors from 'cors'
import helmet from 'helmet';
import config from './shared/config';
import logger from './shared/config/logger';
import mongodb from './shared/config/mongodb.js'
import postgres from './shared/config/postgres.js'
import rabbitmq from './shared/config/rabbitmq.js'
import errorHandler from './shared/middleware/errorhandler';
import ResponseFormatter from './shared/utils/ResponseFormatter.js';


const app = express()
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} `, {
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    })
    next()
})


app.get('/health', (req, res) => {
    res.status(200).json(
        ResponseFormatter.success({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }, "server is healthy", 200)
    )
})


app.use('/', (req, res) => {
    res.status(200).json({
        service: 'api monitoring system',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            ingest: '/api/hits',
            anlytics: '/api/anlytics'
        }
    }, 'Api hit monitoring system')
})


/**
 * 404 handler
 */

app.use((req, res) => {
    res.status(404).json(
        ResponseFormatter.error({
        }, 'Endpoint not found', 404)
    )
})

app.use(errorHandler)



async function initConnection() {
    try {
        logger.info('Connecting to server')

        await mongodb.connect()

        await postgres.testConnection()

        await rabbitmq.connect()

        logger.info('Successfully connected Establish')
    } catch (error) {
        logger.error(`Error while connecct to server ${error}`)
        throw error
    }

}

async const startServer = () => {
    try {
        await initConnection()

        const server = app.listen(config.port, () => {
            logger.info('server is running on port ', config.port)
            logger.info('server is running on Enviroment ', config.node_env)
            logger.info('server is running on endpoint http://localhost:', config.port)
        })

        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received, shutdown gracefully...`)
            server.close(async () => {
                logger.info('Http server closed')
                try {
                    await mongodb.disconnect()
                    await postgres.close()
                    await rabbitmq.close()
                    logger.info('All connection closed.')
                    process.exit(0)
                } catch (error) {
                    logger.error('Error during shutdown. ', error)
                    process.exit(1)
                }
            })
            setTimeout(() => {
                logger.error('Forced Shutdown')
                process.exit(1)
            }, 10000);


            process.on('SIGTERM', () => {   //Signal terminate
                gracefulShutdown('SIGTERM')
            })
            process.on('SIGINT', () => {  //signal interupt
                gracefulShutdown('SIGINT')
            })

            process.on('uncaughtException', () => gracefulShutdown('uncaughtException'))
            process.on('unhandledRejection', () => gracefulShutdown('unhandledRejection'))
        }
    } catch (error) {
        logger.error('Failed to start server ', error)
        process.exit(1)
    }
}

startServer()