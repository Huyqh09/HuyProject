import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Swal from 'sweetalert2'
import { apiUpdateProfile } from '../../services'
import * as actions from '../../store/actions'

const EditAccount = () => {
    const dispatch = useDispatch()
    const { currentData } = useSelector(state => state.user)
    const [form, setForm] = useState({ name: '', phone: '', zalo: '', fbUrl: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setForm({
            name: currentData?.name || '',
            phone: currentData?.phone || '',
            zalo: currentData?.zalo || '',
            fbUrl: currentData?.fbUrl || ''
        })
    }, [currentData])

    const updateField = event => {
        setForm(previous => ({ ...previous, [event.target.name]: event.target.value }))
    }

    const save = async event => {
        event.preventDefault()
        if (saving) return
        setSaving(true)
        try {
            const response = await apiUpdateProfile(form)
            if (response.data?.err !== 0) throw new Error(response.data?.msg || 'Không thể cập nhật thông tin.')
            await dispatch(actions.getCurrent())
            await Swal.fire('Đã cập nhật', 'Thông tin cá nhân của bạn đã được lưu.', 'success')
        } catch (error) {
            await Swal.fire(
                'Không thể cập nhật thông tin',
                error.response?.data?.msg || error.message || 'Vui lòng thử lại.',
                'error'
            )
        } finally {
            setSaving(false)
        }
    }

    const fields = [
        ['name', 'Tên hiển thị', 'text'],
        ['phone', 'Số điện thoại', 'tel'],
        ['zalo', 'Zalo', 'text'],
        ['fbUrl', 'Facebook', 'url']
    ]

    return (
        <div className='flex flex-col items-center'>
            <h1 className='w-full border-b border-gray-200 py-4 text-start text-3xl font-medium'>
                Chỉnh sửa thông tin cá nhân
            </h1>
            <form onSubmit={save} className='flex w-full max-w-2xl flex-col gap-4 py-6'>
                <p className='text-sm text-gray-600'>
                    Mã thành viên: {currentData?.id || '—'}
                </p>
                {fields.map(([name, label, type]) => (
                    <label className='flex flex-col gap-1' key={name}>
                        <span className='font-medium'>{label}</span>
                        <input
                            required={name === 'name' || name === 'phone'}
                            type={type}
                            name={name}
                            value={form[name]}
                            onChange={updateField}
                            className='w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500'
                        />
                    </label>
                ))}
                <button
                    type='submit'
                    disabled={saving}
                    className='self-start rounded-md bg-green-700 px-5 py-2 text-white disabled:opacity-50'
                >
                    {saving ? 'Đang lưu…' : 'Cập nhật thông tin'}
                </button>
            </form>
        </div>
    )
}

export default EditAccount
