import { createContainer, asClass, asFunction, asValue, Lifetime } from 'awilix';
import { logger, redisConnection, t, config, initI18n, i18nInstance } from '@auth/config'; // Added i18nInstance
import { connectDB, disconnectDB } from '@auth/database'; // Added connectDB, disconnectDB
import { initEmailService } from '@auth/email'; // Added initEmailService
import { AuthService, TokenService, AuthController, errorHandlerFactory, loggerMiddlewareFactory } from '@auth/core';

const container = createContainer();

container.register({
  // Core dependencies
  logger: asValue(logger),
  redisConnection: asValue(redisConnection),
  t: asValue(t),
  config: asValue(config), // Register config
  initI18n: asFunction(() => initI18n).singleton(), // Registered initI18n
  i18nInstance: asValue(i18nInstance), // Registered i18nInstance
  connectDB: asFunction(() => connectDB).singleton(), // Registered connectDB
  disconnectDB: asFunction(() => disconnectDB).singleton(), // Registered disconnectDB
  initEmailService: asFunction(() => initEmailService).singleton(), // Registered initEmailService

  // Services
  authService: asClass(AuthService).singleton(),
  tokenService: asClass(TokenService).singleton(),

  // Controllers
  authController: asClass(AuthController).singleton(),

  // Middleware
  errorHandler: asFunction(errorHandlerFactory).singleton(),
  httpLogger: asFunction(loggerMiddlewareFactory).singleton(), // Register loggerMiddlewareFactory
});

export default container;