import amqp from 'amqplib';
import config from "./index.js";
import logger from "./logger.js";

class RabbitMqConnection {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnecting = false
    }

    /**
     * 
     *@returns {Promise<import ('amqplib').Channel |null>} //The initialized RabbitMQ channel, or null if connection fails.
     */

    async connect() {
        try {
            if (this.channel) {
                logger.debug('RabbitMq existing channel reused', {
                    queueName: config.rabbitmq.queueName,
                })
                return this.channel;
            }
            if (this.isConnecting) {
                logger.debug('RabbitMq connection already in progress, waiting', {
                    queueName: config.rabbitmq.queueName,
                })
                await new Promise((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (!this.isConnecting) {
                            clearInterval(checkInterval)
                            resolve()
                        }
                    }, 100);
                })
                return this.channel
            }

            this.isConnecting = true;
            logger.info('Connecting to RabbitMQ', {
                hasUrl: Boolean(config.rabbitmq.url),
                queueName: config.rabbitmq.queueName,
                publisherConfirms: config.rabbitmq.publisherConfirms,
            })

            if (!config.rabbitmq.url) {
                throw new Error('RABBITMQ_URL must be specified.')
            }
            if (!config.rabbitmq.queueName) {
                throw new Error('RABBITMQ_QUEUE must be specified.')
            }

            this.connection = await amqp.connect(config.rabbitmq.url)
            logger.info('RabbitMQ TCP connection established', {
                queueName: config.rabbitmq.queueName,
            })

            this.channel = await this.connection.createChannel()
            logger.info('RabbitMQ channel created', {
                queueName: config.rabbitmq.queueName,
            })

            const dlqName = `${config.rabbitmq.queueName}.dlq`   //Dead letter queue key creation

            await this.channel.assertQueue(dlqName, { //dead letter queue
                durable: true                       //server connection lost, the queue data will be persist
            })
            logger.info('RabbitMQ DLQ asserted', { dlqName })


            //Noram Queue

            await this.channel.assertQueue(config.rabbitmq.queueName, {
                durable: true,
                arguments: {
                    "x-dead-letter-exchange": "",
                    "x-dead-letter-routing-key": dlqName
                }
            })
            logger.info('RabbitMQ queue asserted', {
                queueName: config.rabbitmq.queueName,
                dlqName,
            })

            this.connection.on('close', () => {
                logger.warn('RabbitMQ connection closed', {
                    queueName: config.rabbitmq.queueName,
                })
                this.connection = null
                this.channel = null
            })
            this.connection.on('error', (error) => {
                logger.error('RabbitMQ connection emitted error', {
                    message: error?.message,
                    stack: error?.stack,
                    code: error?.code,
                    queueName: config.rabbitmq.queueName,
                })
                this.connection = null
                this.channel = null
            })
            this.isConnecting = false;
            return this.channel

        } catch (error) {
            logger.error('RabbitMQ connection failed', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
                hasUrl: Boolean(config.rabbitmq.url),
                queueName: config.rabbitmq.queueName,
            })
            this.connection = null
            this.channel = null
            this.isConnecting = false
            throw error
        }
    }


    /**
     * Gets the current RabbitMq channel
     * @returns {import ('amqplib').Channel |null}
     */
    getChannel() {
        return this.channel
    }

    /**
     * get current status of RabbitMq connection
     * @returns {String}
     */
    getStatus() {
        if (!this.connect || !this.channel) return 'Disconnected'
        if (this.channel.closing) return "Closing"
        return 'Connected'
    }


    /**
     * close the existing RabbitMq Connection
     * @returns
     */
    async close() {
        try {
            if (this.channel) {
                await this.channel.close()
                this.channel = null
            }
            if (this.connection) {
                await this.connection.close()
                this.connection = null
            }
            logger.info('RabbitMq connection closed')
        } catch (error) {
            logger.error('Failed to close the RabbitMQ connection', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
            })
            throw error
        }
    }
}

export default new RabbitMqConnection()
