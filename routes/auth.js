const ROLE = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    BASIC: 'basic'
};

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/user/login')
    }
}

function checkRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            res.status(401)
            return res.redirect('/')
        }
        next()
    }
}

module.exports = {
    ROLE: ROLE,
    checkAuthenticated,
    checkRole
}