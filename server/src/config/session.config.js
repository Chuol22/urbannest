import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { env } from './env.js';

const redisClient = createClient({
  url: env.REDIS_URL
});

redisClient.connect().catch(console.error);

export default session({
  store: new RedisStore({ client: redisClient }),
  secret: env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'strict'
  },
  name: 'sessionId'
});