import mongoose from "mongoose";
import { validate } from "uuid";
import SecurityUtils from "../utils/SecurityUtils";
const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[a-z0-9-]+$/,
    },
    email: {
        type: String,
        require: true,
        unique: true,
        validate: {
            validator: function (email) {
                return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
            },
            message: "Please enter valid email"
        }
    },
    description: {
        type: String,
        maxlength: 500,
        default: '',
    },
    website: {
        type: String,
        default: '',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    settings: {
        dataRetentionDays: {
            type: Number,
            default: 30,
            min: 7,
            max: 365,
        },
        alertsEnabled: {
            type: Boolean,
            default: true,
        },
        timezone: {
            type: String,
            default: 'UTC',
        },
    },

}, {
    timestamps: true,
    collation: 'clients'
})

clientSchema.index({ isActive: 1 })

const Client = mongoose.model('Client', clientSchema)
export default Client