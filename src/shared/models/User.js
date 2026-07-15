import mongoose, { mongo } from "mongoose";
import bcrypt from 'bcryptjs'
import { validate } from "uuid";
import SecurityUtils from "../utils/SecurityUtils";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true,
        trim: true,
        minLength: 3,
        validate: {
            validator: function (username) {
                return /^[a-zA-Z0-9_-]+$/.test(username)
            },
            message: 'Please enter valid username'
        }
    },
    email: {
        type: String,
        require: true,
        unique: true,
        lowerCase: true,
        trim: true,
        validate: {
            validator: function (email) {
                return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
            },
            message: "Please enter valid email"
        }
    },
    password: {
        require: true,
        type: String,
        minLength: 6,
        validate: {
            validator: function (password) {
                if (this.isModified('password') && password && !password.startsWith('$2a$')) {
                    const validation = SecurityUtils.validatePassword(password);
                    return validation.success
                }
                return true;
            },
            message: function (props) {
                if (props.value && !props.value.startsWith('$2a$')) {
                    const validation = SecurityUtils.validatePassword(props.value);
                    return validation.errors.join('. ')
                }
                return "true";
            }
        }
    },
    role: {
        type: String,
        enum: ['super_admin', 'client_admin', 'client_viewer'],
        default: 'client_viewer'
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,  //client id 
        ref: 'Client',    //ref to the Client table
        required: function () {
            return this.role !== 'super_admin'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    permissions: {
        canCreateApiKey: {
            type: Boolean,
            default: false
        },
        canManageUsers: {
            type: Boolean,
            default: false
        },
        canViewAnalytics: {
            type: Boolean,
            default: true
        },
        canExportData: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true,
    collection: 'users'
})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (error) {
        next(error)
    }
})

userSchema.index({ clientId: 1, isActive: 1 })
userSchema.index({ role: 1 })

const User = mongoose.model('User', userSchema)

export default User