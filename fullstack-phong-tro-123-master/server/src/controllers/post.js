import * as postService from '../services/post'

const isValidPostPayload = body => (
    typeof body.categoryCode === 'string'
    && typeof body.title === 'string'
    && body.title.trim().length > 0
    && typeof body.address === 'string'
    && body.address.trim().length > 0
    && Number.isFinite(Number(body.priceNumber))
    && Number(body.priceNumber) > 0
    && Number.isFinite(Number(body.areaNumber))
    && Number(body.areaNumber) > 0
    && typeof body.label === 'string'
    && typeof body.contactName === 'string'
    && body.contactName.trim().length > 0
    && /^[0-9+\s()-]{7,20}$/.test(body.contactPhone || '')
)

export const getPosts = async (req, res) => {
    try {
        return res.status(200).json(await postService.getPostsService())
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at post controller: ' + error.message })
    }
}

export const getPostsLimit = async (req, res) => {
    const { page, priceNumber, areaNumber, sort, ...query } = req.query
    try {
        return res.status(200).json(await postService.getPostsLimitService(page, query, { priceNumber, areaNumber, sort }))
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at post controller: ' + error.message })
    }
}

export const getNewPosts = async (req, res) => {
    try {
        return res.status(200).json(await postService.getNewPostService())
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at post controller: ' + error.message })
    }
}

export const smartSearchPosts = async (req, res) => {
    try {
        const response = await postService.smartSearchPostsService(req.query)
        return res.status(200).json({ err: 0, response })
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Smart search failed: ' + error.message })
    }
}

export const getPostById = async (req, res) => {
    try {
        const response = await postService.getPostByIdService(req.params.id)
        if (!response) return res.status(404).json({ err: 1, msg: 'Post not found.' })
        return res.status(200).json({ err: 0, response })
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed to get post: ' + error.message })
    }
}

export const createNewPost = async (req, res) => {
    const { id } = req.user
    if (!id || !isValidPostPayload(req.body)) {
        return res.status(400).json({ err: 1, msg: 'Missing required post fields.' })
    }
    try {
        return res.status(201).json(await postService.createNewPostService(req.body, id))
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at post controller: ' + error.message })
    }
}

export const updatePost = async (req, res) => {
    if (!isValidPostPayload(req.body)) {
        return res.status(400).json({ err: 1, msg: 'Missing or invalid required post fields.' })
    }
    try {
        const response = await postService.updatePostService(req.params.id, req.user.id, req.body)
        if (!response) return res.status(404).json({ err: 1, msg: 'Post not found.' })
        return res.status(200).json({ err: 0, msg: 'Post updated.', response })
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed to update post: ' + error.message })
    }
}

export const deleteMyPost = async (req, res) => {
    try {
        const deleted = await postService.deletePostForUserService(req.params.id, req.user.id)
        if (!deleted) return res.status(404).json({ err: 1, msg: 'Post not found.' })
        return res.status(200).json({ err: 0, msg: 'Post deleted.' })
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed to delete post: ' + error.message })
    }
}

export const geocodeAddress = async (req, res) => {
    const address = typeof req.body.address === 'string' ? req.body.address.trim() : ''
    if (!address || address.length > 300) {
        return res.status(400).json({ err: 1, msg: 'A valid address (maximum 300 characters) is required.' })
    }
    try {
        const response = await postService.geocodePostAddressService(address)
        return res.status(200).json({
            err: 0,
            response,
            msg: response ? 'Location found.' : 'No map location found for this address.'
        })
    } catch (error) {
        return res.status(502).json({ err: -1, msg: 'Address lookup failed: ' + error.message })
    }
}

export const getPostsLimitAdmin = async (req, res) => {
    const { page, ...query } = req.query
    try {
        return res.status(200).json(
            await postService.getPostsLimitAdminService(page, req.user.id, query)
        )
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Failed at post controller: ' + error.message })
    }
}
