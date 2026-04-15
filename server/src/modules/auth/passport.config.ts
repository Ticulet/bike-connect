import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { env } from '../../config/env.js';

export type GoogleProfile = Profile;

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      passReqToCallback: true,
    },
    (req, _accessToken, _refreshToken, profile, done) => {
      // Store the Google profile on a dedicated request property to avoid
      // polluting req.user (which is typed as the DB User by express.d.ts).
      req.googleProfile = profile;
      done(null, {} as Express.User);
    },
  ),
);

export default passport;
