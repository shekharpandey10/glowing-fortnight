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
                return this.channel;
            }
            if (this.isConnecting) {
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
            logger.info('Connecting  to rabbitMq ', config.rabbitmq.url)
            this.connection = await amqp.connect(config.rabbitmq.url)
            this.channel = await this.connection.createChannel()

            const dlqName = `${config.rabbitmq.queue}.dlq`   //Dead letter queue key creation

            await this.channel.assertQueue(dlqName, { //dead letter queue
                durable: true                       //server connection lost, the queue data will be persist
            })


            //Noram Queue

            await this.channel.assertQueue(config.rabbitmq.url, {
                durable: true,
                arguments: {
                    "x-dead-letter-exchange": "",
                    "x-dead-letter-routing-key": dlqName
                }
            })
            logger.info('RabbitMq connected, queue ', config.rabbitmq.queue)

            this.connection.on('close', () => {
                logger.warn(`RabbitMq connection close`)
                this.connection = null
                this.channel = null
            })
            this.connection.on('error', () => {
                logger.error(`RabbitMq connection Error`)
                this.connection = null
                this.channel = null
            })
            this.isConnecting = false;
            return this.channel

        } catch (error) {
            logger.error(`RabbitMq connection Error ${error}`)
            this.connection = null
            this.channel = null
            this.isConnecting = false
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
            logger.error('Failed to close the RabbitMq connection ', error)
            throw error
        }
    }
}

export default new RabbitMqConnection()