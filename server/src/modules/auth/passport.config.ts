import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../../config/env.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    (_accessToken, _refreshToken, profile, done) => {
      // Pass the raw Google profile through as the user object.
      // auth.controller.ts reads it back as Profile to process the login.
      // The Express.User type is widened at the route boundary only.
      done(null, profile as unknown as Express.User);
    },
  ),
);

export default passport;
