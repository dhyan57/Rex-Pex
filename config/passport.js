const passport = require('passport')
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/userSchema");
const env = require("dotenv").config(); // Ensure this is loaded
console.log('jjjjjj');
console.log(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CALLBACK_URL);


// Google OAuth strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID, // Fixed key name
            clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Fixed key name
            callbackURL: process.env.GOOGLE_CALLBACK_URL, // Fixed key name
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });
                if (user) {
                    return done(null, user); // User found, pass to passport
                } else {
                    // If not, create a new user
                    user = new User({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                    });
                    await user.save();
                    return done(null, user); // Pass new user to passport
                }
            } catch (error) {
                console.error("Error during authentication", error);
                return done(error, null);
            }
        }
    )
);


// Serialize user to store in session
passport.serializeUser((user, done) => {
    done(null, user.id); // Only store user ID in session
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then((user) => done(null, user))
        .catch((err) => done(err, null));
});

module.exports = passport;
