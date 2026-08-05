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
    const queueName = overrides.queueName ?? config.rabbitmq.queueName ?? config.rabbitmq.queue

    log.info('[CreateEventProducer] initializing', {
        queueName,
        hasRabbitmqUrl: Boolean(config.rabbitmq.url),
        retryAttampts: config.rabbitmq.retryAttampts,
        retryStrategy: config.retrystrategy,
        circuitbreaker: config.circuitbreaker,
    })

    if (!log) throw new Error('Logger is required.')
    if (!rmq) throw new Error('RabbitMq connection manager is required.')
    if (!queueName) {
        log.error('[CreateEventProducer] missing queue name', {
            configRabbitmq: config.rabbitmq,
            overrideQueueName: overrides.queueName,
        })
        throw new Error('Queue name must be specified.')
    }
    if (!config.rabbitmq.retryAttampts || config.rabbitmq.retryAttampts < 0) {
        log.error('[CreateEventProducer] invalid RabbitMQ retry configuration', {
            retryAttampts: config.rabbitmq.retryAttampts,
        })
        throw new Error('Invalid configuration ')
    }


    const channelManager = overrides.channelManager ?? new ConfirmChannelManager({ rabbitmq: rmq, logger: log })
    const circuitBreaker = overrides.circuitBreaker ?? new CircuitBreaker({
        faliureThreshold: config.circuitbreaker.faliureThreshold ?? 5,
        coolDownMs: config.circuitbreaker.coolDownMs ?? 30_000,
        halfOpenMaxAttampts: config.circuitbreaker.halfOpenMaxAttampts ?? 3,
        logger: log
    })

    const retryStrategy = overrides.retryStrategy ?? new RetryStrategy({
        maxRetry: config.retrystrategy.maxRetry ?? 3,
        baseDelayMs: config.retrystrategy.baseDelayMs ?? 200,
        maxDelayMs: config.retrystrategy.maxDelayMs ?? 5000,
        jitterFactor: config.retrystrategy.jitterFactor ?? 0.3
    })

    log.info('[CreateEventProducer] initialized successfully', { queueName })

    return new EventProducer({
        channelManager,
        circuitBreaker,
        retryStrategy,
        queueName,
        logger: log
    })
}
