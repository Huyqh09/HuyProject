import React from 'react'
import { text } from '../ultils/dataContact'
import { Button } from '../components'
import { useNavigate } from 'react-router-dom'
import { path } from '../ultils/constant'

const Contact = () => {
    const navigate = useNavigate()

    return (
        <div className='bg-white rounded-md shadow-md p-4 w-full max-w-6xl mx-auto flex flex-col justify-center items-center gap-6'>
            <img
                src={text.image}
                alt="thumbnal"
                className='w-full h-48 object-contain'
            />
            <p>{text.content}</p>
            <div className='flex flex-col sm:flex-row items-center justify-around gap-5 w-full'>
                {text.contacts.map((item, index) => {
                    const phone = item.phone.replace(/\D/g, '')
                    const zalo = item.zalo.replace(/\D/g, '')
                    return (
                        <div key={index} className='flex flex-col items-center justify-center'>
                            <span className='text-orange-500 font-semibold'>{item.text}</span>
                            <a href={`tel:${phone}`} className='text-blue-900 text-lg font-semibold'>{item.phone}</a>
                            <a href={`https://zalo.me/${zalo}`} target='_blank' rel='noreferrer' className='text-blue-900 text-lg font-semibold'>{item.zalo}</a>
                        </div>
                    )
                })}
            </div>
            <Button
                text='Gửi liên hệ'
                bgColor='bg-blue-600'
                textColor='text-white'
                px='px-6'
                onClick={() => navigate(path.CONTACT)}
            />
        </div>
    )
}

export default Contact