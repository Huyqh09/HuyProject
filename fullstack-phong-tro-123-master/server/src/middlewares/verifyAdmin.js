const verifyAdmin = (req, res, next) => {
    const adminPhones = (process.env.ADMIN_PHONES || '')
        .split(',')
        .map(phone => phone.trim())
        .filter(Boolean)

    if (adminPhones.length === 0) {
        return res.status(503).json({
            err: 1,
            msg: 'Admin access is not configured. Set ADMIN_PHONES in server/.env.'
        })
    }

    if (!req.user?.phone || !adminPhones.includes(req.user.phone)) {
        return res.status(403).json({
            err: 1,
            msg: 'Admin access required.'
        })
    }

    next()
}

export default verifyAdmin
