


class SecurityUtils {
    static PASSWORD_REQUIREMENTS = {
        minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        requireUppercase: (process.env.PASSWORD_REQUIRE_UPPERCASE || 'true') === 'true',
        requireLowercase: (process.env.PASSWORD_REQUIRE_LOWERCASE || 'true') === 'true',
        requireNumbers: (process.env.PASSWORD_REQUIRE_NUMBERS || 'true') === 'true',
        requireSymbols: (process.env.PASSWORD_REQUIRE_SYMBOLS || 'true') === 'true',
    };

    /**
     * 
     * @param {string} password 
     * @returns {Object}  -Validate response with success and error flag
     */
    static validatePassword(password) {
        const errors = []
        const requirement = this.PASSWORD_REQUIREMENTS;

        if (!password) {
            return {
                success: false,
                errors: ["Password is required"]
            }
        }
        if (password.length < requirement.minLength) {
            errors.push(`Password must be atleast ${requirement.minLength} chars long.`)
        }
        if (requirement.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push(`Password must containe atleast one Uppercase letter.`)

        }
        if (requirement.requireLowercase && !/[a-z]/.test(password)) {
            errors.push(`Password must containe atleast one Lowercase letter.`)

        }
        if (requirement.requireNumbers && !/[0-9]/.test(password)) {
            errors.push(`Password must containe atleast one Number.`)

        }
        if (requirement.requireSymbols && !/[^A-Za-z0-9]/.test(password)) {
            errors.push(`Password must containe atleast one special Character.`)

        }

        // Check for common weak passwords
        const weakPasswords = [
            'password', '123456', 'qwerty', 'admin', 'letmein',
            'password123', 'admin123', '12345678', 'welcome'
        ];

        if (weakPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too comman and easily guessable')
        }

        return {
            success: errors.length === 0,
            errors,
        }

    }
}

export default SecurityUtils