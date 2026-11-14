import axios from 'axios'

let requestQueue = Promise.resolve()
let lastRequestAt = 0

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

export const geocodeAddress = address => {
    const request = requestQueue.then(async () => {
        const delay = 1100 - (Date.now() - lastRequestAt)
        if (delay > 0) await wait(delay)
        lastRequestAt = Date.now()

        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: `${address}, Việt Nam`,
                format: 'jsonv2',
                limit: 1,
                countrycodes: 'vn'
            },
            headers: {
                'User-Agent': 'PhongTro123LocalApp/1.0',
                'Accept-Language': 'vi'
            },
            timeout: 10000
        })
        const result = response.data?.[0]
        if (!result) return null

        const latitude = Number(result.lat)
        const longitude = Number(result.lon)
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
        return { latitude, longitude }
    })

    requestQueue = request.catch(() => undefined)
    return request
}
