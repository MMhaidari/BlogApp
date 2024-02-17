import express from 'express';
import session from 'express-session'
import morgan from 'morgan'
import cors from 'cors'
import rateLimit from 'express-rate-limit';
import MongoStore from 'connect-mongo'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';
import xss from 'xss-clean'
import { body } from 'express-validator';

import AppError from './modules/appError';
import handleRequestErrors from './modules/requestValidator';
import globalErrorHandler from './controllers/errorController';
import { createNewUser, login, logout, protectRoutes } from './controllers/userController';
import { blogsRouter } from './routes/blogsRoute';

const app = express()

app.use(helmet())
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json())
app.use(xss())
app.use(hpp())
app.use(mongoSanitize())

const rateLimiterUsingThirdParty = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  max: 100,
  message: 'You have exceeded the 100 requests in 24 hrs limit!',
  standardHeaders: true,
  legacyHeaders: false,
});

export const mongoStoreOptions = {
  mongoUrl: process.env.DATABASE,
  dbName: 'BlogApplication',
  collectionName: 'sessions', // Name of the collection to store sessions
  ttl: 36000, // Session expiration time (optional)
};

app.use(session({
  store: MongoStore.create(mongoStoreOptions),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 3600000 } // Example cookie configuration
}));

app.post('/signup',
  body('firstName').isString().notEmpty(),
  body('lastName').isString().notEmpty(),
  body('email').isString().notEmpty().isEmail(),
  body('password').isString().notEmpty().isLength({ min: 8 }),
  body('passwordConfirm').isString().notEmpty(),
  body('role').isString().optional(),
  handleRequestErrors,
  rateLimiterUsingThirdParty,
  createNewUser
);

app.post('/login',
  body('email').isEmail(),
  body('password').isString().notEmpty(),
  handleRequestErrors,
  rateLimiterUsingThirdParty,
  login
);

app.post('/logout', logout);

app.use('/api/v1/blogs', protectRoutes, blogsRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404))
})

app.use(globalErrorHandler)

export default app;