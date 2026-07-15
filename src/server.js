import dotenv from 'dotenv'
dotenv.config()
import express from "express";
import cors from 'cors'
import helmet from 'helmet';
import config from './shared/config';
import logger from './shared/config/logger';
import mongodb from './shared/config/mongodb.js'
import postgres from './shared/config/postgres.js'
import rabbitmq from './shared/config/rabbitmq.js'
import errorHandler from './shared/middleware/errorhandler';
import ResponseFormatter from './shared/utils/ResponseFormatter.js';


const app = express()