const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await db.get(
          'SELECT id, email, name, provider FROM users WHERE email = $1',
          [email]
        );

        if (!user) {
          const result = await db.run(
            `INSERT INTO users (email, name, provider)
             VALUES ($1, $2, 'google')
             RETURNING id, email, name, provider`,
            [email, name]
          );

          user = result;
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
