import React, { useEffect, useState } from 'react'
import { Item } from '../../components'
import MapView from '../../components/MapView'
import { apiGetSmartSearch } from '../../services/post'
import parseJson from '../../ultils/parseJson'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { formatVietnameseToString } from '../../ultils/Common/formatVietnameseToString'
import { getSearchFilters } from '../../ultils/Common/getSearchFilters'

const SearchDetail = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const initialFilters = getSearchFilters(location.search)
    const [filters, setFilters] = useState({
        keyword: initialFilters.keyword || '',
        priceMax: initialFilters.priceMax || initialFilters.priceNumber?.[1] || initialFilters.priceNumber?.[0] || '',
        areaMin: initialFilters.areaMin || initialFilters.areaNumber?.[0] || '',
        radiusKm: initialFilters.radiusKm || 25
    })
    const [appliedFilters, setAppliedFilters] = useState(initialFilters)
    const [center, setCenter] = useState(null)
    const [page, setPage] = useState(1)
    const [result, setResult] = useState({ rows: [], markers: [], count: 0 })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const nextFilters = getSearchFilters(location.search)
        setAppliedFilters(nextFilters)
        setFilters(previous => ({
            ...previous,
            keyword: nextFilters.keyword || '',
            priceMax: nextFilters.priceMax || nextFilters.priceNumber?.[1] || nextFilters.priceNumber?.[0] || '',
            areaMin: nextFilters.areaMin || nextFilters.areaNumber?.[0] || '',
            radiusKm: nextFilters.radiusKm || 25
        }))
        setPage(1)
    }, [location.search])

    useEffect(() => {
        let current = true
        const loadResults = async () => {
            setLoading(true)
            setError('')
            try {
                const params = { ...appliedFilters, page }
                for (const key of ['priceNumber', 'areaNumber']) {
                    if (Array.isArray(params[key])) params[key] = params[key].join(',')
                }
                if (center) {
                    params.latitude = center.latitude
                    params.longitude = center.longitude
                }
                const response = await apiGetSmartSearch(params)
                if (current) setResult(response.data.response)
            } catch (requestError) {
                if (current) setError(requestError.response?.data?.msg || requestError.message)
            } finally {
                if (current) setLoading(false)
            }
        }
        loadResults()
        return () => { current = false }
    }, [appliedFilters, center, page])

    const applySearch = event => {
        event.preventDefault()
        const query = { ...appliedFilters }
        if (filters.keyword.trim()) query.keyword = filters.keyword.trim()
        else delete query.keyword
        const selectedPrice = Array.isArray(query.priceNumber) ? query.priceNumber : []
        const selectedPriceMax = selectedPrice.length > 1 ? selectedPrice[1] : selectedPrice[0]
        if (filters.priceMax && Number(filters.priceMax) !== Number(selectedPriceMax)) {
            delete query.priceNumber
            query.priceMax = filters.priceMax
        } else if (!filters.priceMax) {
            delete query.priceNumber
            delete query.priceMax
        }
        const selectedArea = Array.isArray(query.areaNumber) ? query.areaNumber : []
        if (filters.areaMin && Number(filters.areaMin) !== Number(selectedArea[0])) {
            delete query.areaNumber
            query.areaMin = filters.areaMin
        } else if (!filters.areaMin) {
            delete query.areaNumber
            delete query.areaMin
        }
        if (center) query.radiusKm = filters.radiusKm
        setPage(1)
        setAppliedFilters(query)
    }

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            setError('Trình duyệt không hỗ trợ xác định vị trí.')
            return
        }
        navigator.geolocation.getCurrentPosition(
            position => {
                setCenter({ latitude: position.coords.latitude, longitude: position.coords.longitude })
                setPage(1)
            },
            locationError => setError(`Không lấy được vị trí: ${locationError.message}`)
        )
    }

    const openPost = post => navigate(`/chi-tiet/${formatVietnameseToString(post.title)}/${post.id}`)
    const markers = result.markers || []
    const mapCenter = center || (markers.length
        ? {
            latitude: markers.reduce((sum, marker) => sum + Number(marker.latitude), 0) / markers.length,
            longitude: markers.reduce((sum, marker) => sum + Number(marker.longitude), 0) / markers.length
        }
        : undefined)

    return (
        <div className="flex w-full flex-col gap-4">
            <div>
                <h1 className="text-[28px] font-bold">{location.state?.titleSearch || 'Tìm phòng trọ thông minh'}</h1>
                <p className="text-gray-700">Lọc theo ngân sách, diện tích và khoảng cách; kết quả được xếp hạng theo mức độ phù hợp.</p>
            </div>

            <form onSubmit={applySearch} className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-4">
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    <span>Từ khóa / khu vực</span>
                    <input type="search" maxLength="100" value={filters.keyword}
                        onChange={event => setFilters({ ...filters, keyword: event.target.value })}
                        className="rounded border p-2" placeholder="Tên phòng, quận/huyện, địa chỉ…" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    <span>Ngân sách tối đa (triệu/tháng)</span>
                    <input type="number" min="0" step="0.1" value={filters.priceMax}
                        onChange={event => setFilters({ ...filters, priceMax: event.target.value })}
                        className="rounded border p-2" placeholder="Ví dụ: 5" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    <span>Diện tích tối thiểu (m²)</span>
                    <input type="number" min="0" step="1" value={filters.areaMin}
                        onChange={event => setFilters({ ...filters, areaMin: event.target.value })}
                        className="rounded border p-2" placeholder="Ví dụ: 20" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    <span>Bán kính (km)</span>
                    <input type="number" min="1" max="100" value={filters.radiusKm}
                        onChange={event => setFilters({ ...filters, radiusKm: event.target.value })}
                        className="rounded border p-2" disabled={!center} />
                </label>
                <div className="flex flex-wrap items-end gap-2">
                    <button className="rounded bg-blue-700 px-4 py-2 text-white">Tìm phù hợp</button>
                    <button type="button" className="rounded border px-3 py-2" onClick={useMyLocation}>Vị trí của tôi</button>
                    {center && (
                        <button type="button" className="rounded border px-3 py-2"
                            onClick={() => {
                                setCenter(null)
                                setPage(1)
                                setAppliedFilters(({ radiusKm, ...rest }) => rest)
                            }}>Bỏ vị trí</button>
                    )}
                </div>
                <div className="text-sm text-gray-600 md:col-span-4">
                    {center
                        ? <>Vị trí tìm kiếm: {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}. Bấm vào bản đồ để đổi.</>
                        : 'Chọn vị trí tìm kiếm bằng cách bấm vào bản đồ hoặc dùng vị trí hiện tại.'}
                </div>
            </form>

            {error && <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}

            <section>
                <h2 className="mb-2 text-lg font-semibold">Bản đồ tin đăng</h2>
                <MapView
                    center={mapCenter}
                    zoom={center ? 12 : 5}
                    markers={markers}
                    onPick={coordinates => { setCenter(coordinates); setPage(1) }}
                    onMarkerClick={openPost}
                    height={420}
                />
                <p className="mt-1 text-sm text-gray-500">Bản đồ © OpenStreetMap. Tối đa 200 tin có tọa độ được hiển thị trên bản đồ.</p>
            </section>

            <section className="rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-semibold">Kết quả ({result.count || 0})</h2>
                    <span className="text-sm text-gray-600">Xếp hạng theo giá, diện tích và khoảng cách đã chọn.</span>
                </div>
                {loading && <p className="py-4">Đang tìm tin phù hợp…</p>}
                {!loading && result.rows?.map(post => (
                    <div key={post.id}>
                        <div className="mb-1 flex gap-3 text-sm text-blue-800">
                            <span>Mức phù hợp: {post.matchScore}%</span>
                            {post.distanceKm != null && <span>Cách {post.distanceKm.toFixed(1)} km</span>}
                        </div>
                        <Item
                            address={post.address || ''}
                            attributes={post.attributes}
                            description={parseJson(post.description, [])}
                            images={parseJson(post.images?.image, [])}
                            star={Number(post.star) || 0}
                            title={post.title || 'Tin cho thuê'}
                            user={post.user}
                            id={post.id}
                        />
                    </div>
                ))}
                {!loading && !result.rows?.length && <p className="py-6 text-center text-gray-500">Không tìm thấy tin phù hợp với tiêu chí hiện tại.</p>}
                <div className="mt-4 flex items-center justify-center gap-4">
                    <button disabled={page <= 1 || loading} onClick={() => setPage(current => current - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trang trước</button>
                    <span>Trang {page}</span>
                    <button disabled={page * (result.limit || 5) >= result.count || loading} onClick={() => setPage(current => current + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trang sau</button>
                </div>
            </section>
        </div>
    )
}

export default SearchDetail