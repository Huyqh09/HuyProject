import db from '../models'
import { v4 as generateId } from 'uuid'
import moment from 'moment'
import generateCode from '../ultis/generateCode'
import generateProvinceCode from '../ultis/generateProvinceCode'
import generateDate from '../ultis/generateDate'
import { geocodeAddress } from '../ultis/geocodeAddress'
const parseNumberRange = require('../ultis/parseNumberRange')

const { Op } = require('sequelize')

export const getPostsService = async () => {
    const response = await db.Post.findAll({
        raw: true,
        nest: true,
        include: [
            { model: db.Image, as: 'images', attributes: ['image'] },
            { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage', 'published', 'hashtag'] },
            { model: db.User, as: 'user', attributes: ['name', 'zalo', 'phone', 'avatar'] }
        ],
        attributes: ['id', 'title', 'star', 'address', 'description']
    })
    return { err: 0, msg: 'OK', response }
}

export const getPostsLimitService = async (page, query, { priceNumber, areaNumber, sort }) => {
    const currentPage = (!page || +page <= 1) ? 1 : +page
    const queries = { ...query }
    if (priceNumber) queries.priceNumber = { [Op.between]: priceNumber }
    if (areaNumber) queries.areaNumber = { [Op.between]: areaNumber }
    const response = await db.Post.findAndCountAll({
        where: queries,
        raw: true,
        nest: true,
        offset: (currentPage - 1) * (Number(process.env.LIMIT) || 5),
        limit: Number(process.env.LIMIT) || 5,
        order: sort === 'newest'
            ? [['createdAt', 'DESC']]
            : sort === 'price_asc'
                ? [['priceNumber', 'ASC'], ['createdAt', 'DESC']]
                : sort === 'price_desc'
                    ? [['priceNumber', 'DESC'], ['createdAt', 'DESC']]
                    : [['star', 'DESC'], ['createdAt', 'DESC']],
        include: [
            { model: db.Image, as: 'images', attributes: ['image'] },
            { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage', 'published', 'hashtag'] },
            { model: db.User, as: 'user', attributes: ['name', 'zalo', 'phone', 'avatar'] }
        ],
        attributes: ['id', 'title', 'star', 'address', 'description']
    })
    return { err: 0, msg: 'OK', response }
}

export const getNewPostService = async () => {
    const response = await db.Post.findAll({
        raw: true,
        nest: true,
        offset: 0,
        order: [['createdAt', 'DESC']],
        limit: Number(process.env.LIMIT) || 5,
        include: [
            { model: db.Image, as: 'images', attributes: ['image'] },
            { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage', 'published', 'hashtag'] }
        ],
        attributes: ['id', 'title', 'star', 'createdAt']
    })
    return { err: 0, msg: 'OK', response }
}

export const createNewPostService = async (body, userId) => {
    const attributesId = generateId()
    const imagesId = generateId()
    const overviewId = generateId()
    const postId = generateId()
    const labelCode = generateCode(body.label)
    const hashtag = `#${Math.floor(Math.random() * Math.pow(10, 6))}`
    const currentDate = generateDate()
    const provinceName = body?.province || ''
    const provinceValue = provinceName.replace(/^(Thành phố|Tỉnh)\s*/, '')
    const provinceCode = generateProvinceCode(provinceValue)

    const response = await db.sequelize.transaction(async transaction => {
        const post = await db.Post.create({
            id: postId,
            title: body.title,
            labelCode,
            address: body.address || null,
            attributesId,
            categoryCode: body.categoryCode,
            description: JSON.stringify(body.description) || null,
            userId,
            overviewId,
            imagesId,
            areaCode: body.areaCode || null,
            priceCode: body.priceCode || null,
            provinceCode: provinceCode || null,
            priceNumber: body.priceNumber,
            areaNumber: body.areaNumber,
            latitude: body.latitude ?? null,
            longitude: body.longitude ?? null
        }, { transaction })

        await db.User.update(
            { name: body.contactName.trim(), phone: body.contactPhone.trim() },
            { where: { id: userId }, transaction }
        )
        await db.Attribute.create({
            id: attributesId,
            price: +body.priceNumber < 1 ? `${+body.priceNumber * 1000000}đồng/tháng` : `${body.priceNumber}triệu/tháng`,
            acreage: `${body.areaNumber}m2`,
            published: moment(new Date()).format('DD/MM/YYYY'),
            hashtag
        }, { transaction })
        await db.Image.create({ id: imagesId, image: JSON.stringify(body.images || []) }, { transaction })
        await db.Overview.create({
            id: overviewId,
            code: hashtag,
            area: body.label,
            type: body.category,
            target: body.target,
            bonus: 'Tin thường',
            created: currentDate.today,
            expired: currentDate.expireDay
        }, { transaction })
        if (provinceValue) {
            await db.Province.findOrCreate({
                where: { value: provinceValue },
                defaults: { code: provinceCode, value: provinceValue },
                transaction
            })
        }
        await db.Label.findOrCreate({
            where: { code: labelCode },
            defaults: { code: labelCode, value: body.label },
            transaction
        })
        return post
    })
    return { err: 0, msg: 'OK', response }
}

export const updatePostService = async (id, userId, body) => {
    const provinceName = body?.province || ''
    const provinceValue = provinceName.replace(/^(Thành phố|Tỉnh)\s*/, '')
    const provinceCode = generateProvinceCode(provinceValue)

    return db.sequelize.transaction(async transaction => {
        const post = await db.Post.findOne({ where: { id, userId }, transaction })
        if (!post) return null

        const labelCode = generateCode(body.label)
        await post.update({
            title: body.title.trim(),
            address: body.address.trim(),
            labelCode,
            categoryCode: body.categoryCode,
            description: JSON.stringify(body.description) || null,
            areaCode: body.areaCode || null,
            priceCode: body.priceCode || null,
            provinceCode: provinceValue ? provinceCode : post.provinceCode,
            priceNumber: Number(body.priceNumber),
            areaNumber: Number(body.areaNumber),
            latitude: body.latitude ?? null,
            longitude: body.longitude ?? null
        }, { transaction })

        await db.Attribute.update({
            price: Number(body.priceNumber) < 1
                ? `${Number(body.priceNumber) * 1000000}đồng/tháng`
                : `${body.priceNumber}triệu/tháng`,
            acreage: `${body.areaNumber}m2`
        }, { where: { id: post.attributesId }, transaction })
        await db.Image.update(
            { image: JSON.stringify(Array.isArray(body.images) ? body.images : []) },
            { where: { id: post.imagesId }, transaction }
        )
        await db.Overview.update({
            area: body.label,
            type: body.category,
            target: body.target || 'Tất cả'
        }, { where: { id: post.overviewId }, transaction })
        await db.User.update(
            { name: body.contactName.trim(), phone: body.contactPhone.trim() },
            { where: { id: userId }, transaction }
        )
        if (provinceValue) {
            await db.Province.findOrCreate({
                where: { value: provinceValue },
                defaults: { code: provinceCode, value: provinceValue },
                transaction
            })
        }
        await db.Label.findOrCreate({
            where: { code: labelCode },
            defaults: { code: labelCode, value: body.label },
            transaction
        })
        return post
    })
}

export const deletePostForUserService = async (id, userId) => db.sequelize.transaction(async transaction => {
    const post = await db.Post.findOne({ where: { id, userId }, transaction })
    if (!post) return false

    await post.destroy({ transaction })
    if (post.attributesId) await db.Attribute.destroy({ where: { id: post.attributesId }, transaction })
    if (post.imagesId) await db.Image.destroy({ where: { id: post.imagesId }, transaction })
    if (post.overviewId) await db.Overview.destroy({ where: { id: post.overviewId }, transaction })
    return true
})

const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const radians = value => value * Math.PI / 180
    const dLat = radians(lat2 - lat1)
    const dLon = radians(lon2 - lon1)
    const value = Math.sin(dLat / 2) ** 2
        + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export const smartSearchPostsService = async ({
    page = 1,
    priceMax,
    priceNumber,
    areaMin,
    areaNumber,
    provinceCode,
    categoryCode,
    latitude,
    longitude,
    radiusKm = 25,
    keyword
}) => {
    const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1)
    const limit = Math.max(1, Number.parseInt(process.env.LIMIT, 10) || 5)
    const where = {}
    const searchText = typeof keyword === 'string' ? keyword.trim().slice(0, 100) : ''
    const requestedPriceRange = parseNumberRange(priceNumber)
    const requestedAreaRange = parseNumberRange(areaNumber)
    const maxPrice = Number(priceMax)
    const minArea = Number(areaMin)
    const centerLat = Number(latitude)
    const centerLon = Number(longitude)
    const radius = Math.min(100, Math.max(1, Number(radiusKm) || 25))
    const effectiveMaxPrice = requestedPriceRange?.max ?? maxPrice
    const effectiveMinArea = requestedAreaRange?.min ?? minArea
    const hasPrice = requestedPriceRange !== null || (Number.isFinite(maxPrice) && maxPrice > 0)
    const hasArea = requestedAreaRange !== null || (Number.isFinite(minArea) && minArea > 0)
    const hasLocation = Number.isFinite(centerLat) && Number.isFinite(centerLon)

    if (requestedPriceRange) {
        where.priceNumber = {
            [Op.gte]: requestedPriceRange.min,
            ...(requestedPriceRange.max === null ? {} : { [Op.lte]: requestedPriceRange.max })
        }
    } else if (hasPrice) {
        where.priceNumber = { [Op.lte]: maxPrice }
    }
    if (requestedAreaRange) {
        where.areaNumber = {
            [Op.gte]: requestedAreaRange.min,
            ...(requestedAreaRange.max === null ? {} : { [Op.lte]: requestedAreaRange.max })
        }
    } else if (hasArea) {
        where.areaNumber = { [Op.gte]: minArea }
    }
    if (typeof provinceCode === 'string' && provinceCode.trim()) where.provinceCode = provinceCode.trim()
    if (typeof categoryCode === 'string' && categoryCode.trim()) where.categoryCode = categoryCode.trim()
    const conditions = []
    if (searchText) {
        conditions.push({
            [Op.or]: [
                { title: { [Op.like]: `%${searchText}%` } },
                { address: { [Op.like]: `%${searchText}%` } }
            ]
        })
    }
    if (hasLocation) {
        // Only posts that HAVE coordinates can be excluded by distance; posts without
        // coordinates (most legacy/seeded posts) are kept and ranked lower instead.
        const latDelta = radius / 111
        const lonDelta = radius / (111 * Math.max(0.1, Math.cos(centerLat * Math.PI / 180)))
        conditions.push({
            [Op.or]: [
                { latitude: null },
                { longitude: null },
                {
                    latitude: { [Op.between]: [centerLat - latDelta, centerLat + latDelta] },
                    longitude: { [Op.between]: [centerLon - lonDelta, centerLon + lonDelta] }
                }
            ]
        })
    }
    if (conditions.length) where[Op.and] = conditions

    const posts = await db.Post.findAll({
        where,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        limit: 1000,
        include: [
            { model: db.Image, as: 'images', attributes: ['image'] },
            { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage', 'published', 'hashtag'] },
            { model: db.User, as: 'user', attributes: ['name', 'zalo', 'phone', 'avatar'] }
        ],
        attributes: ['id', 'title', 'star', 'address', 'description', 'latitude', 'longitude', 'priceNumber', 'areaNumber', 'provinceCode', 'categoryCode', 'createdAt']
    })

    const ranked = posts.map(post => {
        const price = Number(post.priceNumber)
        const area = Number(post.areaNumber)
        const distanceKm = hasLocation && post.latitude != null && post.longitude != null
            ? haversineDistance(centerLat, centerLon, Number(post.latitude), Number(post.longitude))
            : null
        const scores = []
        if (hasPrice) scores.push({
            value: Number.isFinite(price) && effectiveMaxPrice > 0 ? Math.max(0, 1 - price / effectiveMaxPrice) : 0,
            weight: 0.4
        })
        if (hasArea) scores.push({
            value: Number.isFinite(area) && effectiveMinArea > 0 ? Math.min(1, area / effectiveMinArea) : 0,
            weight: 0.3
        })
        if (hasLocation) scores.push({
            value: distanceKm == null ? 0 : Math.max(0, 1 - distanceKm / radius),
            weight: 0.3
        })
        const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0)
        const matchScore = totalWeight
            ? Math.round(scores.reduce((sum, score) => sum + score.value * score.weight, 0) / totalWeight * 100)
            : 0
        return { ...post, distanceKm, matchScore }
    }).filter(post => !hasLocation || post.distanceKm == null || post.distanceKm <= radius)
        .sort((a, b) => b.matchScore - a.matchScore || new Date(b.createdAt) - new Date(a.createdAt))

    const start = (parsedPage - 1) * limit
    return {
        count: ranked.length,
        rows: ranked.slice(start, start + limit),
        markers: ranked.filter(post => post.latitude != null && post.longitude != null).slice(0, 200),
        page: parsedPage,
        limit
    }
}

export const geocodePostAddressService = address => geocodeAddress(address)

export const getPostByIdService = id => db.Post.findByPk(id, {
    include: [
        { model: db.Image, as: 'images', attributes: ['image'] },
        { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage', 'published', 'hashtag'] },
        { model: db.User, as: 'user', attributes: ['name', 'zalo', 'phone', 'avatar'] },
        { model: db.Overview, as: 'overviews' }
    ]
})

export const getPostsLimitAdminService = async (page, id, query) => {
    const currentPage = (!page || +page <= 1) ? 1 : +page
    const response = await db.Post.findAndCountAll({
        where: { ...query, userId: id },
        raw: true,
        nest: true,
        offset: (currentPage - 1) * (Number(process.env.LIMIT) || 5),
        limit: Number(process.env.LIMIT) || 5,
        order: [['createdAt', 'DESC']],
        include: [
            { model: db.Image, as: 'images', attributes: ['image'] },
            { model: db.Attribute, as: 'attributes', attributes: ['price', 'acreage', 'published', 'hashtag'] },
            { model: db.User, as: 'user', attributes: ['name', 'zalo', 'phone'] },
            { model: db.Overview, as: 'overviews' }
        ]
    })
    return { err: 0, msg: 'OK', response }
}
