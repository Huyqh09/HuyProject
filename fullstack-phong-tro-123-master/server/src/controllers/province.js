import axios from 'axios'
import * as services from '../services/province'

export const getProvinces = async (req, res) => {
    try {
        const response = await services.getProvincesSerivce()
        return res.status(200).json(response)

    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at category controller: ' + error
        })
    }
}

export const getPublicProvinces = async (req, res) => {
    try {
        const response = await axios.get('https://provinces.open-api.vn/api/v1/?depth=2', { timeout: 10000 })
        const results = (Array.isArray(response.data) ? response.data : []).map(province => ({
            province_id: province.code,
            province_name: province.name,
            districts: (province.districts || []).map(district => ({
                district_id: district.code,
                district_name: district.name
            }))
        }))
        return res.status(200).json({ err: 0, results })
    } catch (error) {
        return res.status(502).json({ err: -1, msg: 'Unable to load public provinces: ' + error.message })
    }
}

export const getPublicDistricts = async (req, res) => {
    try {
        const response = await axios.get(
            `https://provinces.open-api.vn/api/v1/p/${encodeURIComponent(req.params.provinceId)}?depth=2`,
            { timeout: 10000 }
        )
        const results = (response.data?.districts || []).map(district => ({
            district_id: district.code,
            district_name: district.name
        }))
        return res.status(200).json({ err: 0, results })
    } catch (error) {
        return res.status(502).json({ err: -1, msg: 'Unable to load public districts: ' + error.message })
    }
}