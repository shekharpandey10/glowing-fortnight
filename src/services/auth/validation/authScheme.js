import { isValidRole } from "../../../shared/constants/roles.js"


export const onboardSuperAdminSchema = {
    username: {
        required: true
    },
    email: {
        required: true
    },
    password: {
        required: true,
        minLength: 8
    }
}

export const registrationSchema = {
    username: {
        required: true
    },
    email: {
        required: true
    },
    password: {
        required: true,
        minLength: 8
    },
    role: {
        required: false,
        custom: (value) => {
            if (!value) return null
            return isValidRole(value) ? null : "Invalid Role"
        }
    }
}


export const loginSchema = {
    username: {
        required: true
    },

    password: {
        required: true,
        minLength: 8
    },
}