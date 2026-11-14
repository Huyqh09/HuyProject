import React, { memo } from 'react'
import moment from 'moment'
import 'moment/locale/vi'
import { Link } from 'react-router-dom'
import { formatVietnameseToString } from '../ultils/Common/formatVietnameseToString'
import { path } from '../ultils/constant'
import roomPlaceholder from '../assets/room-placeholder.svg'

const Sitem = ({ id, title, price, image, createdAt }) => {

    const formatTime = (createdAt) => {
        return moment(createdAt).fromNow()
    }

    return (
        <Link to={`/${path.DETAIL}${formatVietnameseToString(title || 'Tin cho thuê')}/${id}`} className='w-full flex items-center gap-2 py-2 border-b border-gray-300 hover:bg-gray-50'>
            <img
                src={image?.[0] || roomPlaceholder}
                onError={event => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = roomPlaceholder
                }}
                alt="anh"
                className='w-[65px] h-[65px] object-cover flex-none rounded-md'
            />
            <div className='w-full flex-auto flex flex-col justify-between gap-1'>
                <h4 className='text-blue-600 text-[14px]'>{`${title?.slice(0, 45) || 'Tin cho thuê'}...`}</h4>
                <div className=' flex items-center justify-between w-full'>
                    <span className='text-sm font-medium text-green-500'>{price}</span>
                    <span className='text-sm text-gray-300'>{formatTime(createdAt)}</span>
                </div>
            </div>
        </Link>
    )
}

export default memo(Sitem)