

import dotenv from 'dotenv'
dotenv.config()


const config = {
    //server
    node_env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,

    //mongoDb
    mongo: {
        uri: process.env.MONGO_URI,
        dbName: process.env.MONGO_DB_NAME
    },

    //postgreSQL
    postgres: {
        host: process.env.HOST,
        port: parseInt(process.env.PG_PORT),
        database: process.env.PG_DATABASE,
        user: process.env.USER,
        password: process.env.PASSWORD
    },

    //RabbitMQ
    rabbitmq: {
        url: process.env.RABBITMQ_URL,
        queue: process.env.RABBITMQ_QUEUE,
        publisherConfirms: process.env.RABBITMQ_PUBLISHER_CONFIRMS || false,
        retryAttampts: parseInt(process.env.RABBITMQ_RETRY_ATTAMPTS) || 3,
        retryDeley: parseInt(processe.env.RABBITMQ_RETRY_DELEY) || 1000
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), //15 Min
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10)  //1000 req / 15 per min
    }
}


export default config