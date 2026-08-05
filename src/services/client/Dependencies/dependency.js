import UserRepository from "../../auth/repository/UserRepository.js";
import AuthService from "../../auth/service/AuthService.js";
import ClientController from "../controller/ClientController.js";
import ApiKeyRepository from "../repository/ApiKeyRepository.js";
import ClientRepository from "../repository/ClientRepository.js";
import ClientService from "../service/clientService.js";


class Container {
    static init() {
        const repositories = {
            clientRepository: ClientRepository,
            userRepository: UserRepository,
            apiKeyRepository: ApiKeyRepository,

        }
        console.log(ClientRepository);
        console.log(repositories.clientRepository);

        const services = {
            authService: new AuthService(new repositories.userRepository()),
            clientService: new ClientService({
                clientRepository: new repositories.clientRepository(),
                userRepository: new repositories.userRepository(),
                apiKeyRepository: new repositories.apiKeyRepository(),
            }),

        }
        const controller = {
            clientController: new ClientController(services.clientService, services.authService)
        }
        return { repositories, services, controller }
    }




}

const initialized = Container.init()
export { Container }
export default initialized