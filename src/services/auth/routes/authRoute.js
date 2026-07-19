import express from "express";
import dependecies from '../Dependencies/dependecies.js'
import requestLogger from '../../../shared/middleware/requestLogger.js'
import validate from '../../../shared/middleware/validate.js'
import { onboardSuperAdminSchema, loginSchema, registrationSchema } from '../validation/authScheme.js'
const { controllers } = dependecies;
const authController = controllers.authController
const router = express.Router()

router.post('/onboard-super-admin',
    requestLogger,
    validate(onboardSuperAdminSchema),
    (req, res, next) => authController.onboardSuperadmin(req, res, next)
)


export default router