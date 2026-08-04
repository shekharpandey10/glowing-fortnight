import express from "express";
import ingestContainer from '../Dependencies/dependencies.js'
import rateLimit from "express-rate-limit";
import config from "../../../shared/config/index.js";
import validateApiKey from '../../../shared/middleware/validateApiKey.js'
const { ingestController } = ingestContainer

const router = express.Router()

const ingestLimmiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: "Too many requests, please try again later",
        statusCode: 429  //too many requests
    },
    standardHeaders: true,
    legacyHeaders: false
})
router.post('/', validateApiKey, ingestLimmiter, (req, res, next) => ingestController.ingestHit(req, res, next))

export default router