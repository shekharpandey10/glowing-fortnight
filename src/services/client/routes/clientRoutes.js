
import express from "express";
import ClientDependecies from '../Dependencies/dependency.js'
import authenticate from '../../../shared/middleware/authenticate.js'
import requestLogger from '../../../shared/middleware/requestLogger.js'
const router = express.Router()


const { clientController } = ClientDependecies.controller

router.use(authenticate)



router.post('/admin/onboard', requestLogger, (req, res, next) => clientController.createClient(req, res, next))
router.post('/admin/clients/:clientId/users', requestLogger, (req, res, next) => clientController.createClientUser(req, res, next))

export default router