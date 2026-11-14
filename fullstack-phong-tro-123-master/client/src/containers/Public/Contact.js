import React, { useState } from 'react'

const Contact = () => {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const updateField = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const sendContact = event => {
    event.preventDefault()
    const subject = encodeURIComponent(`Liên hệ từ ${form.name}`)
    const body = encodeURIComponent(`Họ tên: ${form.name}\nSố điện thoại: ${form.phone}\n\nNội dung:\n${form.message}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div className='w-full'>
      <h1>Liên hệ với chúng tôi</h1>
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='flex-1 flex flex-col gap-4 bg-red-400 rounded-3xl p-4 text-white bg-gradient-to-br from-blue-700 to-cyan-400'>
          <h4>Thông tin liên hệ</h4>
          <a href='tel:0917686101'>Điện thoại hỗ trợ: 0917686101</a>
          <a href='https://zalo.me/0917686101' target='_blank' rel='noreferrer'>Zalo hỗ trợ: 0917686101</a>
          <p>Gửi yêu cầu qua ứng dụng email trên thiết bị của bạn hoặc liên hệ trực tiếp qua số điện thoại hỗ trợ.</p>
        </div>
        <form onSubmit={sendContact} className='flex-1 bg-white shadow-md rounded-md p-4 flex flex-col gap-4'>
          <h4>Liên hệ trực tuyến</h4>
          <label className='flex flex-col gap-1'>Họ và tên
            <input name='name' value={form.name} onChange={updateField} required maxLength='100' className='rounded border p-2' />
          </label>
          <label className='flex flex-col gap-1'>Số điện thoại
            <input name='phone' type='tel' value={form.phone} onChange={updateField} required maxLength='20' className='rounded border p-2' />
          </label>
          <label className='flex flex-col gap-1'>Nội dung
            <textarea name='message' value={form.message} onChange={updateField} required maxLength='2000' rows='5' className='rounded border p-2' />
          </label>
          <button type='submit' className='self-start rounded bg-blue-700 px-5 py-2 text-white hover:bg-blue-800'>Mở email để gửi</button>
        </form>
      </div>
    </div>
  )
}

export default Contact
