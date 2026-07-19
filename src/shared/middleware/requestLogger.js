import logger from '../../shared/config/logger.js'

const requestLogger = async (req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP %s %s %s %dms ', req.method, req.originalUrl || req.url, req.ip || req.socket.remoteAddress,
            duration, {
            method: req.method,
            path: req.url || req.originalUrl,
            status: req.statusCode,
            duration

        }
        )
    })
    next()
}

export default requestLogger