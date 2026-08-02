import config from '../../config/index.js'
import logger from '../../config/logger.js'
import rabbitmq from '../../config/rabbitmq.js'
import { CircuitBreaker } from './CircuitBreaker.js'
import ConfirmChannelManager from './ConfirmChannelManager.js'
import { EventProducer } from './eventProducer.js'
import RetryStrategy from './RetryStrategy.js'


/**
 * //Factory function (assamble all features)
 * @param {*} overrides 
 */
export default function createEventProducer(overrides = {}) {
    const log = overrides.logger ?? logger
    const rmq = overrides.rabbitmq ?? rabbitmq
    const queueName = overrides.queueName ?? config.rabbitmq.queueName

    if (!log) throw new Error('RabbitMq connection manager is required.')
    if (!queueName) throw new Error('Queue name must be specified.')
    if (!config.rabbitmq.retryAttampts || config.rabbitmq.retryAttampts < 0) throw new Error('Invalid configuration ')


    const channelManager = overrides.channelManager ?? new ConfirmChannelManager({ rabbitmq: rmq, logger: log })
    const circuitBreaker = overrides.circuitBreaker ?? new CircuitBreaker({
        faliureThreshold: config.circuitbreaker.faliureThreshold ?? 5,
        coolDownMs: config.circuitbreaker.coolDownMs ?? 30_000,
        halfOpenMaxAttampts: config.circuitbreaker.halfOpenMaxAttampts ?? 3,
        logger: log
    })

    const retryStrategy = overrides.retryStrategy ?? new RetryStrategy({
        maxRetry: config.retrystrategy.maxDelayMs ?? 3,
        baseDelayMs: config.retrystrategy.baseDelayMs ?? 200,
        maxDelayMs: config.retrystrategy.maxDelayMs ?? 5000,
        jitterFactor: config.retrystrategy.jitterFactor ?? 0.3
    })

    return new EventProducer({
        channelManager,
        circuitBreaker,
        retryStrategy,
        queueName,
        logger: log
    })
}