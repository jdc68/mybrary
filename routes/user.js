const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash')
const User = require('../models/user')
const Book = require('../models/book')
const methodOverride = require('method-override');
const bodyParser = require('body-parser');

const { checkAuthenticated, checkRole, ROLE } = require('./auth')

router.use(flash())
router.use(methodOverride('_method'))

let users = [];


(async() => {
    const query = await User.find({})
    users = Array.from(query)
})();

const initializePassport = require('../passport-config');
const book = require('../models/book');
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id),
    username => users.find(user => user.username === username)
)

router.get('/login', checkNotAuthenticated, async(req, res) => {
    res.render('user/login.ejs')
})

router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/user/login',
        failureFlash: true
    }));

// router.post('/login', (req, res, next) => {
//     passport.authenticate('local', (err, user, info) => {
//         if (err) { return next(err); }
//         if (!user) { return res.redirect('/user/login'); }
//         req.logIn(user, function(err) {
//             if (err) { return next(err); }
//             return res.redirect('/');
//         });
//     })(req, res, next);
// });


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
                password: hashedPassword,
                role: ROLE.BASIC
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

// Edit user route
router.get('/:id/edit', checkAuthenticated, async(req, res) => {
    try {
        const user = await User.findById(req.params.id)
        res.render('user/edit')

    } catch (error) {
        req.flash('error', 'Error editing account')
        res.redirect('/')
    }
})

// Update user route
router.put('/:id', async(req, res) => {
    let user
    try {
        user = await User.findById(req.params.id)
        user.name = req.body.name
        user.lastname = req.body.lastname
        user.username = req.body.username
        user.email = req.body.email
        // user.password = hashedPassword

        await user.save()
        res.redirect(`/users/${user.id}`)

    } catch {
        if (user != null) {
            res.render('user/edit')
        } else {
            res.redirect('/')
        }
    }
})

router.delete('/:id', async(req, res) => {
    let user
    try {
        user = await User.findById(req.params.id)
        const books = await Book.find({ contribtorId: user.id })
        if (books.length > 0) {
            books.forEach(async(book) => {
                console.log(book.title);
                await book.remove()
            })
        }
        await user.remove()
        req.flash('success', 'User removed successfully')
        res.redirect('/user/all')
    } catch (error) {
        console.error(error)
        if (user != null) {
            req.flash('error', 'Could not remove user')
            res.redirect('/user/all')
        } else {
            res.redirect('/')
        }
    }
})

router.get('/all', checkAuthenticated, checkRole(ROLE.ADMIN), (req, res) => {
    res.render('user/all', { users: users })
})

router.get('/:id', checkAuthenticated, async(req, res) => {
    try {
        const user = await User.findById(req.params.id)
        const books = await Book.find({ contribtorId: user.id })

        res.render('user/show', {
            user: user,
            contributedBooks: books,
            ROLE: ROLE
        })

    } catch (error) {
        res.redirect("back")

    }
})

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

module.exports = router