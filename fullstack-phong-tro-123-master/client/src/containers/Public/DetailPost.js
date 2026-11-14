import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiGetPostById } from '../../services/post'
import parseJson from '../../ultils/parseJson'
import MapView from '../../components/MapView'

const DetailPost = () => {
    const { postId } = useParams()
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let current = true
        setLoading(true)
        apiGetPostById(postId)
            .then(response => {
                if (current) setPost(response.data.response)
            })
            .catch(requestError => {
                if (current) setError(requestError.response?.data?.msg || requestError.message)
            })
            .finally(() => {
                if (current) setLoading(false)
            })
        return () => { current = false }
    }, [postId])

    if (loading) return <p className="p-6">Đang tải tin đăng…</p>
    if (error || !post) return <p role="alert" className="p-6 text-red-700">{error || 'Không tìm thấy tin đăng.'}</p>

    const images = parseJson(post.images?.image, [])
    const description = parseJson(post.description, [])
    const hasCoordinates = post.latitude != null && post.longitude != null
    const markers = hasCoordinates ? [{
        id: post.id,
        title: post.title,
        address: post.address,
        latitude: post.latitude,
        longitude: post.longitude
    }] : []

    return (
        <article className="mx-auto w-full max-w-5xl space-y-5 rounded-lg bg-white p-3 sm:p-5 shadow-sm">
            <header>
                <h1 className="text-2xl font-bold">{post.title}</h1>
                <p className="mt-2 text-gray-600">{post.address}</p>
            </header>
            <div className="grid gap-3 sm:grid-cols-2">
                {images.map((image, index) => (
                    <img key={`${image}-${index}`} src={image} alt={`${post.title} ${index + 1}`} className="max-h-[420px] w-full rounded object-cover" />
                ))}
            </div>
            <div className="grid gap-3 rounded bg-gray-50 p-4 sm:grid-cols-3">
                <div><strong>Giá:</strong> {post.attributes?.price || 'Liên hệ'}</div>
                <div><strong>Diện tích:</strong> {post.attributes?.acreage || 'Chưa cập nhật'}</div>
                <div><strong>Người đăng:</strong> {post.user?.name || '—'}</div>
                <div><strong>Điện thoại:</strong> {post.user?.phone || '—'}</div>
                <div><strong>Zalo:</strong> {post.user?.zalo || '—'}</div>
            </div>
            <section>
                <h2 className="mb-2 text-xl font-semibold">Mô tả chi tiết</h2>
                {Array.isArray(description)
                    ? <ul className="list-disc space-y-1 pl-6">{description.map((line, index) => <li key={index}>{line}</li>)}</ul>
                    : <p>{String(description || '')}</p>}
            </section>
            <section>
                <h2 className="mb-2 text-xl font-semibold">Vị trí</h2>
                {hasCoordinates
                    ? <MapView center={{ latitude: Number(post.latitude), longitude: Number(post.longitude) }} markers={markers} height={380} />
                    : <p className="text-gray-600">Tin này chưa có tọa độ bản đồ.</p>}
            </section>
        </article>
    )
}

export default DetailPost
