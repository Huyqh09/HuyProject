import db from '../models'

// GET CURRENT
export const getOne = (id) => new Promise(async (resolve, reject) => {
    try {
        const response = await db.User.findOne({
            where: { id },
            raw: true,
            attributes: {
                exclude: ['password']
            }
        })
        resolve({
            err: response ? 0 : 1,
            msg: response ? 'OK' : 'Failed to get user.',
            response
        })
    } catch (error) {
        reject(error)
    }
})

// UPDATE CURRENT
export const updateOne = async (id, values) => {
    const user = await db.User.findByPk(id)
    if (!user) return null
    await user.update(values)
    const response = user.get({ plain: true })
    delete response.password
    return response
}
