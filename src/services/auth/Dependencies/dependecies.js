import AuthService from '../service/AuthService.js'
import AuthController from '../controller/authController.js'
import MongoUserRepository from '../repository/UserRepository.js'

class Container {
    static init() {
        const repositories = {
            UserRepository: MongoUserRepository
        }


        const services = {
            authService=new AuthService(repositories.UserRepository)
        }


        const controllers = {
            authController= new AuthController(services.authService)
        }

        return { repositories, services, controllers }
    }
}

const initialized = Container.init()
export { Container }
export default initialized