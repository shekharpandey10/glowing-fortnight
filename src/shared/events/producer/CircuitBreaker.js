export const CircuitState = Object.freeze({
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HELF_OPEN'
})

export class CircuitBreaker {
    constructor(options = {}) {
        this.faliureThreshold = options.faliureThreshold ?? 5  //how much time we can try
        this.coolDownMs = options.coolDownMs ?? 30000
        this.halfOpenMaxAttampts = options.halfOpenMaxAttampts ?? 3
        this.logger = options.logger ?? console

        //private fields
        this._state = CircuitState.CLOSED    //default it's closed
        this._failures = 0
        this._lastFailureTime = 0
        this._halfOpenAttempts = 0
        this._halfOpenSuccesses = 0
    }


    /**
     * (curr time - last failure time)  is greater then cooldown time ==> let's one more try or stop
     * @returns {Boolean}
     */
    _cooldownElapsed() {
        return Date.now() - this._lastFailureTime >= this.coolDownMs
    }


    /**
     * //update the circuit state
     * @param {String} newState 
     */
    _transitionTo(newState) {
        const prevState = this._state
        this._state = newState
        if (newState === CircuitState.HALF_OPEN) {
            this._halfOpenAttempts = 0
            this._halfOpenSuccesses = 0
        this.logger.info('[CircuitBreaker] state changed', {
            from: prevState,
            to: newState,
        })
        }
    }

    /**
     * open the circuit
     * @returns {}
     */
    _openCircuit() {
        this._lastFailureTime = Date.now()
        this._transitionTo(CircuitState.OPEN)
        this.logger.error('[CircuitBreaker] opened', {
            failure: this._failures,
            coolDownMs: this.coolDownMs
        })
    }

    /**
     * reset all states
     */
    _reset() {
        this._state = CircuitState.CLOSED
        this._failures = 0
        this._lastFailureTime = 0
        this._halfOpenAttempts = 0
        this._halfOpenSuccesses = 0
    }

    //getter ==> get current state
    get state() {
        if (this._state === CircuitState.OPEN && this._cooldownElapsed()) { //if system is down and cooltime window over so again half open the system
            this._transitionTo(CircuitState.HALF_OPEN)
        }
        return this._state
    }


    allowRequest() {
        const current = this.state //getter state

        if (current === CircuitState.CLOSED) return true
        if (current === CircuitState.HALF_OPEN) {
            if (this._halfOpenAttempts < this.halfOpenMaxAttampts) {
                this._halfOpenAttempts++
                return true
            }
            return false
        }
        return false
    }

    onSuccess() {

        this.logger.info('[CircuitBreaker] success recorded', {
            state: this._state,
            halfOpenSuccesses: this._halfOpenSuccesses,
            halfOpenMaxAttempts: this.halfOpenMaxAttampts,
            failures: this._failures
        });
        if (this._state === CircuitState.HALF_OPEN) {
            this._halfOpenSuccesses++
            this.logger.info('[CircuitBreaker] half-open success recorded', {
                halfOpenSuccesses: this._halfOpenSuccesses,
                halfOpenMaxAttempts: this.halfOpenMaxAttampts,
            });
            if (this._halfOpenSuccesses >= this.halfOpenMaxAttampts) {
                this._reset() //again go to the close mode 
                this.logger.info(`[circuitBreaker] reset to CLOSED after successful half-open problems`)
            }

            if (this._failures > 0) {
                this._failures = 0
                this.logger.info(`[circuitBreaker] failure counter reset after successful half-open problems`)
            }
        }
    }

    onFailure() {
        if (this._state === CircuitState.HALF_OPEN) {
            this.logger.info('[CircuitBreaker] half-open failed, reopening')
            this._openCircuit()
            return;
        }
        this._failures++
        this._lastFailureTime = Date.now()
        this.logger.warn('[CircuitBreaker] failure recorded', {
            failures: this._failures,
            failureThreshold: this.faliureThreshold,
            state: this._state,
        })
        if (this._failures >= this.faliureThreshold) {
            this._openCircuit()
        }
    }

    /**
 * Returns a snapshot of the current state of the circuit breaker.
 * @returns {{state: string, failures: number, lastFailureTime: number, halfOpenAttempts: number, halfOpenSuccesses: number, cooldownMs: number,failureThreshold: number}} 
 * The snapshot of the circuit breaker state.
 * @private
 */
    snapshot() {
        return {
            state: this.state,
            failures: this._failures,
            lastFailuretime: this._lastFailureTime,
            halfOpenAttempts: this._halfOpenAttempts,
            halfOpenSuccesses: this._halfOpenSuccesses
        }
    }

}
