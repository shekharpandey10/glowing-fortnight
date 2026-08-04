import { EventEmitter } from 'node:events'


class ConfirmChannelManager extends EventEmitter {
    constructor({ rabbitmq, logger }) {
        super();
        if (!rabbitmq) throw new Error("Confirm channel manager requires rabbitmq connection manager")

        this.rabbitmq = rabbitmq;
        this.logger = logger ?? console;

        this._channel = null
        this._connecting = false;
        this._connectWaiters = []
    }


    async getChannel() {
        if (this._channel) {
            this.logger.debug('[ChannelManager] existing confirm channel reused')
            return this._channel
        }

        if (this._connecting) {   //handle concurency 
            this.logger.debug('[ChannelManager] connect already in progress, queueing waiter')
            return new Promise((resolve, reject) => {
                this._connectWaiters.push({ resolve, reject })
            })
        }
        return this._connect()
    }

    async _connect() {
        this._connecting = true;
        try {
            this.logger.info('[ChannelManager] creating confirm channel')
            let connection
            if (this.rabbitmq.connection) {
                this.logger.debug('[ChannelManager] reusing RabbitMQ connection')
                connection = this.rabbitmq.connection
            } else {
                this.logger.debug('[ChannelManager] no RabbitMQ connection found, connecting')
                const baseChannel = await this.rabbitmq.connect()

                if (!baseChannel?.connection) {
                    throw new Error('Failed to connect with Rabbitmq instance')
                }
                connection = baseChannel.connection
            }


            const confirmChannel = await connection.createConfirmChannel()
            confirmChannel.on('drain', () => this.emit('drain'))
            confirmChannel.on('close', () => {
                this.logger.warn('[ChannelManager] confirm channel closed unexpectedly');
                this._channel = null
            })
            confirmChannel.on('error', (error) => {
                this.logger.error('[ChannelManager] confirm channel error', {
                    error: error.message,
                    stack: error.stack,
                    code: error.code,
                });
                this._channel = null
                this.emit('error', error)
            })


            this._channel = confirmChannel
            this.logger.info('[ChannelManager] confirm channel ready');

            for (const w of this._connectWaiters) w.resolve(confirmChannel)
            this._connectWaiters = []
            return confirmChannel
        } catch (error) {
            this.logger.error('[ChannelManager] failed to create confirm channel', {
                message: error?.message,
                stack: error?.stack,
                code: error?.code,
            })
            for (const w of this._connectWaiters) w.reject(error)
            this._connectWaiters = [];
            throw error;
        } finally {
            this._connecting = false
        }

    }
}

export default ConfirmChannelManager
