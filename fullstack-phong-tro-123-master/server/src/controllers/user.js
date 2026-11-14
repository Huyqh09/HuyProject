import * as services from '../services/user'

export const getCurrent = async (req, res) => {
    const { id } = req.user
    try {
        const response = await services.getOne(id)
        return res.status(200).json(response)

    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at category controller: ' + error
        })
    }
}

export const updateProfile = async (req, res) => {
    const { name, phone, zalo, fbUrl } = req.body
    if (typeof name !== 'string' || !name.trim()
        || typeof phone !== 'string' || !/^[0-9+\s()-]{7,20}$/.test(phone.trim())
        || (zalo != null && typeof zalo !== 'string')
        || (fbUrl != null && typeof fbUrl !== 'string')) {
        return res.status(400).json({ err: 1, msg: 'Tên và số điện thoại hợp lệ là bắt buộc.' })
    }

    try {
        const response = await services.updateOne(req.user.id, {
            name: name.trim(),
            phone: phone.trim(),
            zalo: typeof zalo === 'string' ? zalo.trim() : '',
            fbUrl: typeof fbUrl === 'string' ? fbUrl.trim() : ''
        })
        if (!response) return res.status(404).json({ err: 1, msg: 'Không tìm thấy tài khoản.' })
        return res.status(200).json({ err: 0, msg: 'Đã cập nhật thông tin cá nhân.', response })
    } catch (error) {
        return res.status(500).json({ err: -1, msg: 'Không thể cập nhật thông tin cá nhân: ' + error.message })
    }
}