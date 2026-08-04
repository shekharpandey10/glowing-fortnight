import { EVENT_TYPES } from "../eventContracts.js";
import { isRetryable } from './RetryStrategy.js'

export class EventProducer {
    constructor({ channelManager, circuitBreaker, retryStrategy, logger, queueName }) {
        if (!channelManager) throw new Error('EventProducer requires channelManager');
        if (!circuitBreaker) throw new Error('EventProducer requires circuitBreaker');
        if (!retryStrategy) throw new Error('EventProducer requires retryStrategy');
        if (!queueName) throw new Error('EventProducer requires queueName');

        this._channelManager = channelManager
        this._circuitBreaker = circuitBreaker
        this._retryStrategy = retryStrategy
        this._queueName = queueName
        this._logger = logger ?? console;

        this._metrics = {
            published: 0,
            failed: 0,
            retriesExhausted: 0
        }
        this._shuttingDown = false

        this._logger.info('[EventProducer] created', {
            queueName: this._queueName,
        })
    }


    _incrementMetric(metric) {
        this._metrics[metric] = (this._metrics[metric] || 0) + 1
    }

    async publishApiHit(eventData, opts = {}) {
        this._logger.debug('[EventProducer] publish requested', {
            eventId: eventData?.eventId,
            endpoint: eventData?.endpoint,
            queueName: this._queueName,
        })

        if (this._shuttingDown) {
            const error = new Error("EventProducer is shutting down");
            error.code = 'SHUTDOWN_IN_PROGRESS';
            this._logger.info('[EventProducer] publish rejected — shutting down', {
                eventId: eventData.eventId,
            });
            throw error;
        }

        if (!this._circuitBreaker.allowRequest()) {
            this._logger.info('[EventProducer] circuit breaker rejected publish', {
                eventId: eventData.eventId,
                state: this._circuitBreaker.state,
            });
            return false;
        }


        const correlationId = opts.correlationId ?? eventData.eventId;
        const startMs = Date.now();
        let attempt = 0;


        while (true) {
            const attemptNumber = attempt + 1;
            try {
                await this._publish(eventData, { correlationId, attemptNumber })
                const latencyMs = Date.now() - startMs
                this._circuitBreaker.onSuccess();
                this._incrementMetric('published');

                this._logger.info('[EventProducer] published', {
                    eventId: eventData.eventId,
                    correlationId,
                    attempt: attemptNumber,
                    latencyMs,
                    endpoint: eventData.endpoint,
                });

                return true;
            } catch (error) {

                this._logger.error('[EventProducer] publish attempt failed', {
                    eventId: eventData.eventId,
                    correlationId,
                    attempt: attemptNumber,
                    error: error.message,
                });
                const canRetry = isRetryable(error) && this._retryStrategy.shouldRetry(attempt);

                if (!canRetry) {
                    this._circuitBreaker.onFailure();
                    this._incrementMetric('failed');
                    if (!this._retryStrategy.shouldRetry(attempt)) {
                        this._incrementMetric('retriesExhausted');
                    }
                    this._logger.error('[EventProducer] publish failed; returning rejected state', {
                        eventId: eventData.eventId,
                        correlationId,
                        attempt: attemptNumber,
                        retryable: isRetryable(error),
                        circuitBreaker: this._circuitBreaker.snapshot(),
                        error: error.message,
                    })
                    return false
                }
                this._logger.info('[EventProducer] retrying publish', {
                    eventId: eventData.eventId,
                    correlationId,
                    failedAttempt: attemptNumber,
                    nextAttempt: attemptNumber + 1,
                    error: error.message,
                })
                await this._retryStrategy.wait(attempt);
                attempt++
            }
        }
    }


    async _publish(eventData, { correlationId, attemptNumber }) {
        this._logger.debug('[EventProducer] getting channel for publish', {
            eventId: eventData.eventId,
            correlationId,
            attempt: attemptNumber,
            queueName: this._queueName,
        })
        const channel = await this._channelManager.getChannel()
        const message = {
            type: EVENT_TYPES.API_HIT,
            data: eventData,
            publishedAt: new Date().toISOString(),
            attempt: attemptNumber
        }


        const buffer = Buffer.from(JSON.stringify(message))
        const publishOptions = {
            persistent: true,
            contentType: 'applicaion/json',
            messageId: eventData.eventId,
            correlationId: correlationId,
            timeStamp: Math.floor(Date.now() / 1000)
        }


        return new Promise((resolve, reject) => {
            const written = channel.publish(
                '',  //default exchange
                this._queueName,
                buffer,
                publishOptions,
                (err) => {
                    if (err) reject(new Error(`Publish nacked: ${err.message}`))
                    resolve()
                }
            )

            if (!written) {  //queue is full  handle backpressure
                this._logger.info('[EventProducer] back-pressure detected, waiting for drain', {
                    eventId: eventData.eventId,
                });
            }

            this._logger.debug('[EventProducer] publish written to channel', {
                eventId: eventData.eventId,
                correlationId,
                queueName: this._queueName,
                written,
            })


            const onDrain = () => {
                channel.removeListener('drain', onDrain);
                this._logger.debug('[EventProducer] drain event received', {
                    eventId: eventData.eventId,
                });
            }

            channel.once("drain", onDrain)
        })
    }


    async _shutDown() {
        this._shuttingDown = true;
        this._logger.info('[EventProducer] shutting down…');
        await this._channelManager.close();
        this._logger.info('[EventProducer] shutting completed');
    }

    getStats() {
        return {
            metrics: { ...this._metrics },
            circuitBreaker: this._circuitBreaker.snapshot()
        }
    }




}
