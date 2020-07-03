const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByEmail, getUserById) {
    let user;
    const authenticateUser = async(email, password, done) => {
        user = getUserByEmail(email);
        if (user == null) {
            return done(null, false, { message: 'Account not found' })
        }
        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: 'Wrong password' })
            }
        } catch (e) {
            return done(e);
        }
    }
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id))
    })
}

module.exports = initialize