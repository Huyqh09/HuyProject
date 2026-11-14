import React, { useEffect, useState } from 'react'
import { apiUploadImages } from '../../services'
import parseJson from '../../ultils/parseJson'
import {
    apiDeleteAdminCategory,
    apiDeleteAdminPost,
    apiDeleteAdminProvince,
    apiDeleteAdminUser,
    apiGetAdminCategories,
    apiGetAdminPosts,
    apiGetAdminProvinces,
    apiGetAdminSummary,
    apiGetAdminUsers,
    apiGeocodeMissingPosts,
    apiSaveAdminCategory,
    apiSaveAdminProvince,
    apiUpdateAdminPost
} from '../../services/admin'

const tabs = [
    { id: 'posts', label: 'Bài đăng' },
    { id: 'users', label: 'Tài khoản' },
    { id: 'categories', label: 'Danh mục' },
    { id: 'provinces', label: 'Địa điểm' }
]

const emptyCategory = { code: '', value: '', header: '', subheader: '' }
const emptyProvince = { code: '', value: '' }

const errorMessage = error => error.response?.data?.msg || error.message || 'Đã xảy ra lỗi.'

const AdminManagement = () => {
    const [activeTab, setActiveTab] = useState('posts')
    const [summary, setSummary] = useState(null)
    const [rows, setRows] = useState([])
    const [form, setForm] = useState(emptyCategory)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [reload, setReload] = useState(0)
    const [geocoding, setGeocoding] = useState(false)
    const [postCategories, setPostCategories] = useState([])
    const [editingPost, setEditingPost] = useState(null)
    const [postForm, setPostForm] = useState(null)
    const [uploadingImages, setUploadingImages] = useState(false)
    const [savingPost, setSavingPost] = useState(false)

    useEffect(() => {
        let current = true
        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const summaryResponse = await apiGetAdminSummary()
                if (!current) return
                setSummary(summaryResponse.data.response)
                const loaders = {
                    posts: apiGetAdminPosts,
                    users: apiGetAdminUsers,
                    categories: apiGetAdminCategories,
                    provinces: apiGetAdminProvinces
                }
                const response = await loaders[activeTab]()
                if (current) {
                    setRows(response.data.response || [])
                    if (activeTab === 'posts') {
                        const categoriesResponse = await apiGetAdminCategories()
                        if (current) setPostCategories(categoriesResponse.data.response || [])
                    }
                }
            } catch (requestError) {
                if (current) setError(errorMessage(requestError))
            } finally {
                if (current) setLoading(false)
            }
        }
        load()
        return () => { current = false }
    }, [activeTab, reload])

    const resetForm = () => {
        setEditingId(null)
        setForm(activeTab === 'categories' ? emptyCategory : emptyProvince)
    }

    const remove = async (id, label, action) => {
        if (!window.confirm(`Bạn chắc chắn muốn xóa ${label}?`)) return
        setError('')
        setNotice('')
        try {
            const response = await action(id)
            setNotice(response.data.msg || 'Đã xóa thành công.')
            setReload(value => value + 1)
        } catch (requestError) {
            setError(errorMessage(requestError))
        }
    }

    const beginEdit = row => {
        setEditingId(row.id)
        setForm(activeTab === 'categories'
            ? { code: row.code || '', value: row.value || '', header: row.header || '', subheader: row.subheader || '' }
            : { code: row.code || '', value: row.value || '' })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const beginEditPost = post => {
        const parsedImages = parseJson(post.images?.image, [])
        const parsedDescription = parseJson(post.description, post.description || '')
        setEditingPost(post)
        setPostForm({
            title: post.title || '',
            address: post.address || '',
            categoryCode: post.categoryCode || '',
            description: typeof parsedDescription === 'string' ? parsedDescription : JSON.stringify(parsedDescription),
            priceNumber: post.priceNumber ?? '',
            areaNumber: post.areaNumber ?? '',
            provinceCode: post.provinceCode || '',
            images: Array.isArray(parsedImages) ? parsedImages : []
        })
        setError('')
        setNotice('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const uploadPostImages = async event => {
        const files = Array.from(event.target.files || [])
        event.target.value = ''
        if (!files.length) return
        setUploadingImages(true)
        try {
            const urls = []
            for (const file of files) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('upload_preset', process.env.REACT_APP_UPLOAD_ACCESS_NAME)
                const response = await apiUploadImages(formData)
                if (response.status !== 200 || !response.data?.secure_url) {
                    throw new Error('Dịch vụ lưu ảnh không trả về đường dẫn ảnh.')
                }
                urls.push(response.data.secure_url)
            }
            setPostForm(previous => ({ ...previous, images: [...previous.images, ...urls] }))
        } catch (requestError) {
            setError(requestError.response?.data?.error?.message || requestError.message)
        } finally {
            setUploadingImages(false)
        }
    }

    const savePost = async event => {
        event.preventDefault()
        if (!editingPost || savingPost) return
        setSavingPost(true)
        setError('')
        setNotice('')
        try {
            const response = await apiUpdateAdminPost(editingPost.id, {
                ...postForm,
                priceNumber: Number(postForm.priceNumber),
                areaNumber: Number(postForm.areaNumber)
            })
            setNotice(response.data.msg || 'Đã cập nhật bài đăng.')
            setEditingPost(null)
            setPostForm(null)
            setReload(value => value + 1)
        } catch (requestError) {
            setError(errorMessage(requestError))
        } finally {
            setSavingPost(false)
        }
    }

    const save = async event => {
        event.preventDefault()
        setSaving(true)
        setError('')
        setNotice('')
        try {
            const saveAction = activeTab === 'categories' ? apiSaveAdminCategory : apiSaveAdminProvince
            const response = await saveAction(form, editingId)
            setNotice(response.data.msg || 'Đã lưu thành công.')
            resetForm()
            setReload(value => value + 1)
        } catch (requestError) {
            setError(errorMessage(requestError))
        } finally {
            setSaving(false)
        }
    }

    const geocodeBatch = async () => {
        setGeocoding(true)
        setError('')
        setNotice('')
        try {
            const response = await apiGeocodeMissingPosts()
            const { updated, numericUpdated, notFound, remaining } = response.data.response
            setNotice(`Đã gán tọa độ ${updated} tin và cập nhật giá/diện tích cho ${numericUpdated} tin. Không tìm thấy vị trí cho ${notFound} tin trong lô. Còn ${remaining} tin cần xử lý.`)
            setReload(value => value + 1)
        } catch (requestError) {
            setError(errorMessage(requestError))
        } finally {
            setGeocoding(false)
        }
    }

    const renderRows = () => {
        if (activeTab === 'posts') return rows.map(post => (
            <tr key={post.id}>
                <td className="border p-3">{post.title}</td>
                <td className="border p-3">{post.user?.name || '—'}<br /><small>{post.user?.phone}</small></td>
                <td className="border p-3">{post.attributes?.price || '—'}<br />{post.attributes?.acreage || ''}</td>
                <td className="border p-3">{post.address || '—'}</td>
                <td className="border p-3">
                    <button className="mr-2 rounded bg-blue-700 px-3 py-1 text-white" onClick={() => beginEditPost(post)}>Sửa</button>
                    <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={() => remove(post.id, 'bài đăng này', apiDeleteAdminPost)}>Xóa</button>
                </td>
            </tr>
        ))

        if (activeTab === 'users') return rows.map(user => (
            <tr key={user.id}>
                <td className="border p-3">{user.name || '—'}</td>
                <td className="border p-3">{user.phone || '—'}</td>
                <td className="border p-3">{user.zalo || '—'}</td>
                <td className="border p-3">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                <td className="border p-3">
                    <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={() => remove(user.id, 'tài khoản này và toàn bộ bài đăng của tài khoản', apiDeleteAdminUser)}>Xóa</button>
                </td>
            </tr>
        ))

        return rows.map(row => (
            <tr key={row.id}>
                <td className="border p-3">{row.code}</td>
                <td className="border p-3">{row.value}</td>
                {activeTab === 'categories' && <td className="border p-3">{row.header}</td>}
                <td className="border p-3 flex gap-2">
                    <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={() => beginEdit(row)}>Sửa</button>
                    <button
                        className="rounded bg-red-600 px-3 py-1 text-white"
                        onClick={() => remove(
                            row.id,
                            activeTab === 'categories' ? 'danh mục này' : 'địa điểm này',
                            activeTab === 'categories' ? apiDeleteAdminCategory : apiDeleteAdminProvince
                        )}
                    >Xóa</button>
                </td>
            </tr>
        ))
    }

    const renderTable = () => {
        const headers = {
            posts: ['Tiêu đề', 'Người đăng', 'Giá / diện tích', 'Địa chỉ', 'Thao tác'],
            users: ['Tên', 'Số điện thoại', 'Zalo', 'Ngày tạo', 'Thao tác'],
            categories: ['Mã', 'Tên danh mục', 'Tiêu đề SEO', 'Thao tác'],
            provinces: ['Mã', 'Tỉnh / thành phố', 'Thao tác']
        }
        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                    <thead><tr>{headers[activeTab].map(header => <th className="border bg-gray-100 p-3" key={header}>{header}</th>)}</tr></thead>
                    <tbody>{renderRows()}</tbody>
                </table>
                {!rows.length && !loading && <p className="py-6 text-center text-gray-500">Chưa có dữ liệu.</p>}
                {rows.length === 500 && <p className="mt-2 text-sm text-gray-500">Đang hiển thị tối đa 500 dòng mới nhất.</p>}
            </div>
        )
    }

    const renderForm = () => {
        if (!['categories', 'provinces'].includes(activeTab)) return null
        const fields = activeTab === 'categories'
            ? [['code', 'Mã danh mục'], ['value', 'Tên danh mục'], ['header', 'Tiêu đề SEO'], ['subheader', 'Mô tả SEO']]
            : [['code', 'Mã địa điểm'], ['value', 'Tên tỉnh / thành phố']]
        return (
            <form className="mb-6 rounded border bg-gray-50 p-4" onSubmit={save}>
                <h2 className="mb-3 text-lg font-semibold">{editingId ? 'Cập nhật' : 'Thêm'} {activeTab === 'categories' ? 'danh mục' : 'địa điểm'}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    {fields.map(([key, label]) => (
                        <label className="flex flex-col gap-1" key={key}>
                            <span>{label}</span>
                            {key === 'subheader'
                                ? <textarea required value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} className="rounded border p-2" />
                                : <input required value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} className="rounded border p-2" />}
                        </label>
                    ))}
                </div>
                <div className="mt-4 flex gap-2">
                    <button disabled={saving} className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu'}</button>
                    {editingId && <button type="button" className="rounded border px-4 py-2" onClick={resetForm}>Hủy sửa</button>}
                </div>
            </form>
        )
    }

    const renderPostForm = () => {
        if (activeTab !== 'posts' || !editingPost || !postForm) return null
        return (
            <form className="space-y-4 rounded border bg-gray-50 p-4" onSubmit={savePost}>
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Sửa bài đăng: {editingPost.title}</h2>
                    <button
                        type="button"
                        className="rounded border px-3 py-1"
                        onClick={() => { setEditingPost(null); setPostForm(null) }}
                    >Đóng</button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span>Tiêu đề</span>
                        <input required value={postForm.title} onChange={event => setPostForm({ ...postForm, title: event.target.value })} className="rounded border p-2" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span>Danh mục</span>
                        <select required value={postForm.categoryCode} onChange={event => setPostForm({ ...postForm, categoryCode: event.target.value })} className="rounded border p-2">
                            <option value="">Chọn danh mục</option>
                            {postCategories.map(category => <option key={category.code} value={category.code}>{category.value}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span>Địa chỉ</span>
                        <input required value={postForm.address} onChange={event => setPostForm({ ...postForm, address: event.target.value })} className="rounded border p-2" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span>Giá (triệu đồng/tháng)</span>
                        <input required type="number" min="0.01" step="any" value={postForm.priceNumber} onChange={event => setPostForm({ ...postForm, priceNumber: event.target.value })} className="rounded border p-2" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span>Diện tích (m²)</span>
                        <input required type="number" min="0.01" step="any" value={postForm.areaNumber} onChange={event => setPostForm({ ...postForm, areaNumber: event.target.value })} className="rounded border p-2" />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                        <span>Mô tả</span>
                        <textarea rows="5" value={postForm.description} onChange={event => setPostForm({ ...postForm, description: event.target.value })} className="rounded border p-2" />
                    </label>
                </div>
                <div>
                    <p className="mb-2 font-medium">Ảnh phòng</p>
                    <label className="inline-flex cursor-pointer rounded bg-gray-200 px-3 py-2">
                        {uploadingImages ? 'Đang tải ảnh…' : 'Thêm ảnh'}
                        <input type="file" accept="image/*" multiple disabled={uploadingImages} onChange={uploadPostImages} className="hidden" />
                    </label>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {postForm.images.map((image, index) => (
                            <div key={`${image}-${index}`} className="relative">
                                <img src={image} alt={`Ảnh phòng ${index + 1}`} className="h-28 w-full rounded object-cover" />
                                <button
                                    type="button"
                                    aria-label={`Xóa ảnh ${index + 1}`}
                                    onClick={() => setPostForm(previous => ({
                                        ...previous,
                                        images: previous.images.filter((_, imageIndex) => imageIndex !== index)
                                    }))}
                                    className="absolute right-1 top-1 rounded bg-white px-2 py-1 text-red-700 shadow"
                                >Xóa</button>
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    disabled={savingPost || uploadingImages}
                    className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50"
                >{savingPost ? 'Đang cập nhật…' : 'Cập nhật bài đăng'}</button>
            </form>
        )
    }

    return (
        <section className="space-y-5">
            <div>
                <h1 className="text-3xl font-semibold">Quản trị hệ thống</h1>
                <p className="mt-1 text-gray-600">Quản lý nội dung và tài khoản toàn hệ thống.</p>
            </div>
            {summary && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Bài đăng', summary.posts],
                        ['Tài khoản', summary.users],
                        ['Danh mục', summary.categories],
                        ['Địa điểm', summary.provinces]
                    ].map(([label, count]) => (
                        <div className="rounded border bg-white p-4 shadow-sm" key={label}>
                            <div className="text-sm text-gray-500">{label}</div>
                            <div className="mt-1 text-2xl font-semibold">{count}</div>
                        </div>
                    ))}
                </div>
            )}
            <nav className="flex flex-wrap gap-2 border-b pb-3">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`rounded px-4 py-2 ${activeTab === tab.id ? 'bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        onClick={() => {
                            setActiveTab(tab.id)
                            setNotice('')
                            setEditingId(null)
                            setEditingPost(null)
                            setPostForm(null)
                            setForm(tab.id === 'categories' ? emptyCategory : emptyProvince)
                        }}
                    >{tab.label}</button>
                ))}
            </nav>
            {activeTab === 'posts' && (
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        disabled={geocoding}
                        className="rounded bg-indigo-700 px-4 py-2 text-white disabled:opacity-50"
                        onClick={geocodeBatch}
                    >{geocoding ? 'Đang xử lý tối đa 10 tin…' : 'Định vị và bổ sung dữ liệu (10 tin)'}</button>
                    <span className="text-sm text-gray-600">Gửi địa chỉ tới OpenStreetMap Nominatim; chạy tuần tự theo giới hạn dịch vụ.</span>
                </div>
            )}
            {error && <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}
            {error.includes('Admin access') && <p className="text-sm text-gray-700">Thêm số điện thoại tài khoản quản trị vào `ADMIN_PHONES` trong `server/.env`, khởi động lại backend rồi đăng nhập lại.</p>}
            {notice && <div role="status" className="rounded border border-green-300 bg-green-50 p-3 text-green-800">{notice}</div>}
            {renderForm()}
            {renderPostForm()}
            {loading ? <p>Đang tải dữ liệu…</p> : renderTable()}
        </section>
    )
}

export default AdminManagement
