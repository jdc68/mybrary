const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash')
const User = require('../models/user')
const methodOverride = require('method-override');

const { checkAuthenticated } = require('./auth')

router.use(flash())
router.use(methodOverride('_method'))

let users = [];

(async() => {
    const query = await User.find({})
    users = Array.from(query)
    console.log(users);
    
})();

const initializePassport = require('../passport-config');
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id),
    username => users.find(user => user.username === username)
)

router.get('/login', checkNotAuthenticated, async(req, res) => {
    res.render('user/login.ejs')
})

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/user/login',
    failureFlash: true,
    successFlash: true
}))

router.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('user/register.ejs')
})

router.post('/register', async(req, res) => {
    if (req.body.password.length < 6) {
        req.flash('error', 'Password must be longer than 6 characters')
        res.redirect('/user/register')
    } else {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const user = new User({
                name: req.body.name,
                lastname: req.body.lastname,
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword
            })
            users.push(user)
            await user.save()
            res.redirect('/user/login')
        } catch (err) {
            if (err.code == 11000) {
                req.flash('error', 'There is already an account with this email')
                res.redirect('/user/register')
            } else {
                req.flash('error', 'Unknow error')
                res.redirect('/user/register')
            }
        }
    }
})

router.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/user/login');
})

router.get('/account', checkAuthenticated, (req, res) => {
    res.render('user/account', {user: req.user})
})

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

module.exports = router