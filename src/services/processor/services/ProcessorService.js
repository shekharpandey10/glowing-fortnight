import logger from "../../../shared/config/logger"


export default class ProcessorService {
    constructor({ apiHitRepository, metricsRepository }) {
        if (!apiHitRepository || !metricsRepository) throw new Error("Processor sercice requires apiHitRepository and metricsRepository.")

        this.apiHitRepository = apiHitRepository
        this.metricsRepository = metricsRepository
    }


    getTimeBucket(timestamp, interval = 'hour') {   //round off the time
        const date = new Date(timestamp)

        switch (interval) {
            case "hour":
                date.setMinutes(0, 0, 0)
                break;
            case "day":
                date.setHours(0, 0, 0, 0)
                break;
            case "minute":
                date.setSeconds(0, 0)
                break;
            default:
                date.setMinutes(0, 0, 0)
        }
        return date
    }

    async processEvent(eventData) {
        let rawEventSaved = false  //eventual consistancy

        try {

            logger.info('Processing event data:', {
                eventId: eventData.eventId,
                clientId: eventData.clientId,
                serviceName: eventData.serviceName,
                endpoint: eventData.endpoint,
                method: eventData.method,
                I
            })

            //save data to mongoDb

            await this.apiHitRepository.save(eventData)
            rawEventSaved = true  //mean mongodb m data save ho gya h
            logger.info('Raw event saved to mongoDb:', {
                eventId: eventData.eventId,
                I
            })

            //pg data upsert (if this fail, still work bcs mongodb is the source of the truth)
            await this._updateMatricsWithFallback(eventData)
            logger.info('Event Processed successfully:', {
                eventId: eventData.eventId,
                I
            })
        } catch (error) {
            if (!rawEventSaved) {  //check the data saved into the source of truth
                logger.info('Critical: Failed to save raw data to mongoDb', {
                    eventId: eventData.eventId,
                    I
                })
                throw error
            }

            logger.error('Non-critical: Raw event saved but metrics update failed:', {
                error: error.message,
                eventId: eventData.eventId,
            })
        }

    }

    async _updateMatricsWithFallback(eventData) {
        try {
            const timebucket = this.timebucket(eventData.timebucket, "hour")

            //data format prep

            const metricsData = {
                clientId: eventData.clientId.toString(),
                serviceName: eventData.serviceName,
                endpoint: eventData.endpoint,
                method: eventData.method,
                totalHits: 1,
                errorHits: eventData.statusCode > 400 ? 1 : 0,
                avgLatency: eventData.latencyMs,
                minLatency: eventData.latencyMs,
                maxLatency: eventData.latencyMs,
                timeBucket,
            }
            await this.metricsRepository.upsertEndpointMetrics(metricsData)
            logger.info('Metrics updated successfully', {
                eventId: eventData.eventId,
            })
        } catch (error) {

            //for future : add retry mechanism
            logger.info('Error while update matrics in the pgDb', {
                error
            })
            throw error
        }
    }

    async cleanUpOldEvents(daysToKeep = 30) {
        try {
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

            const deletedCount = this.apiHitRepository.deleteOldHits(cutoffDate)
            return deletedCount
        } catch (error) {
            logger.error('Error during cleanup:', error);
            throw error;
        }
    }
}