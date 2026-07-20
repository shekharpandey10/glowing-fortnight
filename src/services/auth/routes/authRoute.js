import express from "express";
import dependecies from '../Dependencies/dependecies.js'
import requestLogger from '../../../shared/middleware/requestLogger.js'
import validate from '../../../shared/middleware/validate.js'
import { onboardSuperAdminSchema, loginSchema, registrationSchema } from '../validation/authScheme.js'
import authenticate from "../../../shared/middleware/authenticate.js";
import authorize from "../../../shared/middleware/authorize.js";
import { ROLES, APPLICATION_ROLES } from "../../../shared/constants/roles.js";
const { controllers } = dependecies;
const authController = controllers.authController
const router = express.Router()

router.post('/onboard-super-admin',
    requestLogger,
    validate(onboardSuperAdminSchema),
    (req, res, next) => authController.onboardSuperadmin(req, res, next)
)

router.post('/register',
    requestLogger,
    authenticate,
    authorize([APPLICATION_ROLES.SUPER_ADMIN]),
    validate(registrationSchema),
    (req, res, next) => authController.register(req, res, next)
)

router.post('/login',
    requestLogger,
    validate(loginSchema),
    (req, res, next) => authController.login(req, res, next)
)

router.get('/profile',
    requestLogger,
    authenticate,
    (req, res, next) => authController.getProfile(req, res, next)
)
router.get('/logout',
    requestLogger,
    authenticate,
    (req, res, next) => authController.logOut(req, res, next)
)

export default router