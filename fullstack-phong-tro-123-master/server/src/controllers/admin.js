import db from '../models'
import { geocodeAddress } from '../ultis/geocodeAddress'
import generateCode from '../ultis/generateCode'
const { Op } = require('sequelize')
const enrichmentFailures = new Set()

const handleError = (res, error) => res.status(500).json({
    err: -1,
    msg: 'Admin operation failed: ' + error.message
})

const requiredString = value => typeof value === 'string' && value.trim().length > 0
const firstNumber = value => {
    const match = String(value || '').replace(/,/g, '.').match(/\d+(?:\.\d+)?/)
    return match ? Number(match[0]) : null
}
const priceInMillions = value => {
    const text = String(value).toLowerCase()
    const amount = firstNumber(value)
    if (amount == null) return null
    if (text.includes('tỷ')) return amount * 1000
    if (text.includes('triệu') || /\d\s*tr\b/.test(text)) return amount
    if (text.includes('nghìn') || text.includes('ngàn') || /\d\s*k\b/.test(text)) return amount / 1000
    if (text.includes('đồng') || text.includes('vnđ') || text.includes('vnd') || /đ(?:\/|$|\s)/.test(text)) {
        const digits = text.match(/[\d.,]+/)
        const rawAmount = digits ? Number(digits[0].replace(/[.,]/g, '')) : null
        return rawAmount == null ? null : rawAmount / 1000000
    }
    return amount
}
const areaInSquareMeters = value => firstNumber(value)

export const getSummary = async (req, res) => {
    try {
        const [users, posts, categories, provinces] = await Promise.all([
            db.User.count(),
            db.Post.count(),
            db.Category.count(),
            db.Province.count()
        ])
        return res.status(200).json({ err: 0, response: { users, posts, categories, provinces } })
    } catch (error) {
        return handleError(res, error)
    }
}

export const getUsers = async (req, res) => {
    try {
        const response = await db.User.findAll({
            attributes: ['id', 'name', 'phone', 'zalo', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 500,
            raw: true
        })
        return res.status(200).json({ err: 0, response })
    } catch (error) {
        return handleError(res, error)
    }
}

export const deleteUser = async (req, res) => {
    try {
        const user = await db.User.findByPk(req.params.id, { attributes: ['id', 'phone'] })
        if (!user) return res.status(404).json({ err: 1, msg: 'Account not found.' })
        if (user.phone === req.user.phone) {
            return res.status(400).json({ err: 1, msg: 'You cannot delete your own admin account.' })
        }

        await db.sequelize.transaction(async transaction => {
            const posts = await db.Post.findAll({
                where: { userId: user.id },
                attributes: ['attributesId', 'imagesId', 'overviewId'],
                raw: true,
                transaction
            })
            const ids = key => posts.map(post => post[key]).filter(Boolean)

            await db.Post.destroy({ where: { userId: user.id }, transaction })
            if (ids('attributesId').length) {
                await db.Attribute.destroy({ where: { id: { [Op.in]: ids('attributesId') } }, transaction })
            }
            if (ids('imagesId').length) {
                await db.Image.destroy({ where: { id: { [Op.in]: ids('imagesId') } }, transaction })
            }
            if (ids('overviewId').length) {
                await db.Overview.destroy({ where: { id: { [Op.in]: ids('overviewId') } }, transaction })
            }
            await user.destroy({ transaction })
        })
        return res.status(200).json({ err: 0, msg: 'Account and its posts deleted.' })
    } catch (error) {
        return handleError(res, error)
    }
}

export const getPosts = async (req, res) => {
    try {
        const response = await db.Post.findAll({
            attributes: [
                'id', 'title', 'address', 'categoryCode', 'description',
                'priceNumber', 'areaNumber', 'provinceCode', 'createdAt'
            ],
            include: [
                { model: db.User, as: 'user', attributes: ['name', 'phone'] },
                { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage'] },
                { model: db.Image, as: 'images', attributes: ['image'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 500
        })
        return res.status(200).json({ err: 0, response })
    } catch (error) {
        return handleError(res, error)
    }
}

export const updatePost = async (req, res) => {
    const { title, address, categoryCode, description, priceNumber, areaNumber, provinceCode, images } = req.body
    if (!requiredString(title) || !requiredString(address) || !requiredString(categoryCode)
        || !Number.isFinite(Number(priceNumber)) || Number(priceNumber) <= 0
        || !Number.isFinite(Number(areaNumber)) || Number(areaNumber) <= 0
        || !Array.isArray(images)) {
        return res.status(400).json({ err: 1, msg: 'Tiêu đề, địa chỉ, danh mục, giá, diện tích và danh sách ảnh hợp lệ là bắt buộc.' })
    }

    try {
        const updated = await db.sequelize.transaction(async transaction => {
            const post = await db.Post.findByPk(req.params.id, { transaction })
            if (!post) return null
            const labelValue = `${categoryCode} ${address.split(',')[0]}`
            const labelCode = generateCode(labelValue)

            await post.update({
                title: title.trim(),
                address: address.trim(),
                categoryCode: categoryCode.trim(),
                description: typeof description === 'string' ? description : JSON.stringify(description || ''),
                priceNumber: Number(priceNumber),
                areaNumber: Number(areaNumber),
                provinceCode: typeof provinceCode === 'string' && provinceCode.trim()
                    ? provinceCode.trim()
                    : post.provinceCode,
                labelCode
            }, { transaction })
            await db.Attribute.update({
                price: Number(priceNumber) < 1
                    ? `${Number(priceNumber) * 1000000}đồng/tháng`
                    : `${priceNumber}triệu/tháng`,
                acreage: `${areaNumber}m2`
            }, { where: { id: post.attributesId }, transaction })
            await db.Image.update(
                { image: JSON.stringify(images) },
                { where: { id: post.imagesId }, transaction }
            )
            await db.Overview.update(
                { area: labelValue, type: categoryCode },
                { where: { id: post.overviewId }, transaction }
            )
            await db.Label.findOrCreate({
                where: { code: labelCode },
                defaults: { code: labelCode, value: labelValue },
                transaction
            })
            return post
        })

        if (!updated) return res.status(404).json({ err: 1, msg: 'Post not found.' })
        return res.status(200).json({ err: 0, msg: 'Post updated.', response: updated })
    } catch (error) {
        return handleError(res, error)
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await db.Post.findByPk(req.params.id)
        if (!post) return res.status(404).json({ err: 1, msg: 'Post not found.' })

        await db.sequelize.transaction(async transaction => {
            await db.Post.destroy({ where: { id: post.id }, transaction })
            if (post.attributesId) await db.Attribute.destroy({ where: { id: post.attributesId }, transaction })
            if (post.imagesId) await db.Image.destroy({ where: { id: post.imagesId }, transaction })
            if (post.overviewId) await db.Overview.destroy({ where: { id: post.overviewId }, transaction })
        })
        return res.status(200).json({ err: 0, msg: 'Post deleted.' })
    } catch (error) {
        return handleError(res, error)
    }
}

export const getCategories = async (req, res) => {
    try {
        const response = await db.Category.findAll({ order: [['id', 'ASC']], raw: true })
        return res.status(200).json({ err: 0, response })
    } catch (error) {
        return handleError(res, error)
    }
}

export const saveCategory = async (req, res) => {
    const { code, value, header, subheader } = req.body
    if (![code, value, header, subheader].every(requiredString)) {
        return res.status(400).json({ err: 1, msg: 'Code, value, header and subheader are required.' })
    }
    try {
        const data = { code: code.trim(), value: value.trim(), header: header.trim(), subheader: subheader.trim() }
        if (req.params.id) {
            const category = await db.Category.findByPk(req.params.id)
            if (!category) return res.status(404).json({ err: 1, msg: 'Category not found.' })
            await db.sequelize.transaction(async transaction => {
                if (category.code !== data.code) {
                    await db.Post.update(
                        { categoryCode: data.code },
                        { where: { categoryCode: category.code }, transaction }
                    )
                }
                await category.update(data, { transaction })
            })
            return res.status(200).json({ err: 0, response: category })
        }
        const response = await db.Category.create(data)
        return res.status(201).json({ err: 0, response })
    } catch (error) {
        return handleError(res, error)
    }
}

export const deleteCategory = async (req, res) => {
    try {
        const category = await db.Category.findByPk(req.params.id)
        if (!category) return res.status(404).json({ err: 1, msg: 'Category not found.' })
        const usedByPosts = await db.Post.count({ where: { categoryCode: category.code } })
        if (usedByPosts) {
            return res.status(409).json({ err: 1, msg: 'Cannot delete a category used by existing posts.' })
        }
        await category.destroy()
        return res.status(200).json({ err: 0, msg: 'Category deleted.' })
    } catch (error) {
        return handleError(res, error)
    }
}

export const getProvinces = async (req, res) => {
    try {
        const response = await db.Province.findAll({ order: [['value', 'ASC']], raw: true })
        return res.status(200).json({ err: 0, response })
    } catch (error) {
        return handleError(res, error)
    }
}

export const saveProvince = async (req, res) => {
    const { code, value } = req.body
    if (![code, value].every(requiredString)) {
        return res.status(400).json({ err: 1, msg: 'Code and value are required.' })
    }
    try {
        const data = { code: code.trim(), value: value.trim() }
        if (req.params.id) {
            const province = await db.Province.findByPk(req.params.id)
            if (!province) return res.status(404).json({ err: 1, msg: 'Location not found.' })
            await db.sequelize.transaction(async transaction => {
                if (province.code !== data.code) {
                    await db.Post.update(
                        { provinceCode: data.code },
                        { where: { provinceCode: province.code }, transaction }
                    )
                }
                await province.update(data, { transaction })
            })
            return res.status(200).json({ err: 0, response: province })
        }
        const response = await db.Province.create(data)
        return res.status(201).json({ err: 0, response })
    } catch (error) {
        return handleError(res, error)
    }
}

export const deleteProvince = async (req, res) => {
    try {
        const province = await db.Province.findByPk(req.params.id)
        if (!province) return res.status(404).json({ err: 1, msg: 'Location not found.' })
        const usedByPosts = await db.Post.count({ where: { provinceCode: province.code } })
        if (usedByPosts) {
            return res.status(409).json({ err: 1, msg: 'Cannot delete a location used by existing posts.' })
        }

        await province.destroy()
        return res.status(200).json({ err: 0, msg: 'Location deleted.' })
    } catch (error) {
        return handleError(res, error)
    }
}

export const geocodeMissingPosts = async (req, res) => {
    const requestedLimit = Number.parseInt(req.body?.limit, 10) || 10
    const limit = Math.min(10, Math.max(1, requestedLimit))
    const incompletePost = {
        [Op.or]: [
            { latitude: null },
            { longitude: null },
            { priceNumber: null },
            { areaNumber: null }
        ]
    }
    const eligiblePosts = {
        [Op.and]: [
            incompletePost,
            ...(enrichmentFailures.size ? [{ id: { [Op.notIn]: [...enrichmentFailures] } }] : [])
        ]
    }
    try {
        const posts = await db.Post.findAll({
            where: eligiblePosts,
            attributes: ['id', 'address', 'latitude', 'longitude', 'priceNumber', 'areaNumber'],
            include: [{ model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage'] }],
            order: [['createdAt', 'ASC']],
            limit
        })
        let updated = 0
        let numericUpdated = 0
        let notFound = 0
        for (const post of posts) {
            const changes = {}
            if (post.priceNumber == null) {
                const priceNumber = priceInMillions(post.attributes?.price)
                if (priceNumber != null) changes.priceNumber = priceNumber
            }
            if (post.areaNumber == null) {
                const areaNumber = areaInSquareMeters(post.attributes?.acreage)
                if (areaNumber != null) changes.areaNumber = areaNumber
            }
            if (Object.keys(changes).some(key => key === 'priceNumber' || key === 'areaNumber')) numericUpdated++

            if ((post.latitude == null || post.longitude == null) && post.address) {
                try {
                    const coordinates = await geocodeAddress(post.address)
                    if (coordinates) {
                        Object.assign(changes, coordinates)
                        updated++
                    } else {
                        notFound++
                    }
                } catch (error) {
                    notFound++
                    console.error(`Geocoding failed for post ${post.id}:`, error.message)
                }
            }
            if (Object.keys(changes).length) await post.update(changes)
            if (
                post.latitude == null && changes.latitude == null
                || post.longitude == null && changes.longitude == null
                || post.priceNumber == null && changes.priceNumber == null
                || post.areaNumber == null && changes.areaNumber == null
            ) {
                enrichmentFailures.add(post.id)
            }
        }
        const remaining = await db.Post.count({ where: eligiblePosts })
        return res.status(200).json({
            err: 0,
            response: { processed: posts.length, updated, numericUpdated, notFound, remaining }
        })
    } catch (error) {
        return handleError(res, error)
    }
}
