
/**
 * List of error message patterns and codes that are considered retryable. This includes common network-related errors and RabbitMQ-specific errors that indicate transient issues with the connection or channel. The isRetryable function uses this list to determine if an error should trigger a retry attempt.
 * @constant {string[]}
 */
export const RETRYABLE_PATTERNS = [
    'channel closed',
    'connection closed',
    'ECONNRESET',
    'ECONNREFUSED',
    'EAI_AGAIN',
    'ENOTFOUND',
    'ETIMEDOUT',
    'buffer full',
    'createConfirmChannel',
    'getaddrinfo',
    'heartbeat timeout',
    'not available',
    'server connection closed',
];



export const isRetryable = (error) => {
    if (!error) return false
    const msg = (error.message || '').toLowerCase()  //'connection closed'
    const code = (error.code || '').toUpperCase()  //    'ETIMEDOUT'

    return RETRYABLE_PATTERNS.some((p) => msg.includes(p.toLowerCase()) || code.includes(p.toUpperCase()))
}

/**
 * Retry Engine
 */
class RetryStrategy {
    constructor(options = {}) {
        this.maxRetry = options.maxRetry ?? 3
        this.baseDelayMs = options.baseDelayMs ?? 200
        this.maxDelayMs = options.maxDelayMs ?? 5000  //5 sec
        this.jitterFactor = options.jitterFactor ?? 0.3  //30% randomness

    }

    /**
  * Determines if another retry attempt should be made based on the current attempt count.
  * @param {number} attempt - The current attempt count.
  * @returns {boolean} - True if another retry attempt should be made, false otherwise.
  */
    shouldRetry(attempt) {
        return attempt < this.maxRetry
    }

    /**
   * Calculates the delay for the next retry attempt using exponential backoff with jitter.
   * @param {number} attempt - The current attempt count.
   * @returns {number} - The delay in milliseconds for the next retry attempt.
   */
    delay(attempt) {
        const exponential = this.baseDelayMs * Math.pow(2, attempt)  //exponential backoff
        const capped = Math.min(exponential, this.maxDelayMs)

        const jitterRange = capped * this.jitterFactor

        const jitter = (Math.random() - 0.5) * 2 * jitterRange

        return Math.max(0, Math.round(capped + jitter))
    }

    /**
 * Waits for the calculated delay before the next retry attempt.
 * @param {number} attempt - The current attempt count.
 * @returns {Promise<void>} - Resolves after the delay for the next retry attempt.
 */

    wait(attempt) {
        const ms = this.delay(attempt)
        return new Promise((resolve) => setTimeout(() => {
            resolve()
        }, ms))
    }
}

export default RetryStrategy
