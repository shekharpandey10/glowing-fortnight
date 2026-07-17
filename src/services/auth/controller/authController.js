class AuthController {
    constructor(authService) {
        if (!authService) throw new Error('authService is required')
        this.authService = authService
    }
}