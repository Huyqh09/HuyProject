import React, { memo, useState } from 'react'
import icons from '../ultils/icons'
import {  Link } from 'react-router-dom'
import { formatVietnameseToString } from '../ultils/Common/formatVietnameseToString'
import {path} from '../ultils/constant'
import anonAvatar from '../assets/anon-avatar.png'
import roomPlaceholder from '../assets/room-placeholder.svg'
const indexs = [0, 1, 2, 3]

const { GrStar, RiHeartFill, RiHeartLine, BsBookmarkStarFill } = icons

const Item = ({ images, user, title, star, description, attributes, address, id }) => {
    const [isHoverHeart, setIsHoverHeart] = useState(false)
    const photoList = Array.isArray(images) ? images.filter(image => typeof image === 'string' && image.trim()) : []
    const previewImages = photoList.length > 0 ? photoList.filter((image, index) => indexs.includes(index)) : [roomPlaceholder]

    const getAvatarSource = avatar => {
        if (typeof avatar === 'string' && avatar.trim()) return avatar
        if (!Array.isArray(avatar?.data) || avatar.data.length === 0) return anonAvatar

        const bytes = Uint8Array.from(avatar.data)
        const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
        const isGif = bytes[0] === 0x47 && bytes[1] === 0x49
        const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45
        const mimeType = isPng ? 'image/png' : isGif ? 'image/gif' : isWebp ? 'image/webp' : 'image/jpeg'
        let binary = ''
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
        }
        return `data:${mimeType};base64,${window.btoa(binary)}`
    }

    const avatarSource = getAvatarSource(user?.avatar)
    const addressParts = String(address || '').split(',')
    const shortAddress = addressParts.length > 1
        ? addressParts.slice(-2).join(', ')
        : addressParts[0]

    const handleStar = (star) => {
        let stars = []
        for (let i = 1; i <= +star; i++) stars.push(<GrStar className='star-item' size={18} color='yellow' />)
        return stars

    }
    return (
        <div className='w-full flex flex-col sm:flex-row border-t border-orange-600 py-4 gap-3'>
            <Link
                to={`/${path.DETAIL}${formatVietnameseToString(title)}/${id}`}
                className='w-full sm:w-2/5 flex flex-wrap gap-[2px] items-center relative cursor-pointer'
            >
                {previewImages.map((image, index) => {
                    return (
                        <img
                            key={`${image}-${index}`}
                            src={image}
                            onError={event => {
                                event.currentTarget.onerror = null
                                event.currentTarget.src = roomPlaceholder
                            }}
                            alt={photoList.length ? `Ảnh phòng ${index + 1}` : 'Ảnh minh họa phòng trọ'}
                            className={`${previewImages.length === 1 ? 'w-full h-[244px]' : 'w-[47%] h-[120px]'} object-cover`}
                        />
                    )
                })}
                <span className='bg-overlay-70 text-white px-2 rounded-md absolute left-1 bottom-4'>
                    {photoList.length ? `${photoList.length} ảnh` : 'Ảnh minh họa'}
                </span>
                <span
                    className='text-white absolute right-5 bottom-1'
                    onMouseEnter={() => setIsHoverHeart(true)}
                    onMouseLeave={() => setIsHoverHeart(false)}
                >
                    {isHoverHeart ? <RiHeartFill size={26} color='red' /> : <RiHeartLine size={26} />}
                </span>
            </Link>
            <div className='w-full sm:w-3/5 min-w-0'>
                <div className='flex justify-between gap-4 w-full'>
                    <div className='text-red-600 font-medium'>
                        {handleStar(+star).length > 0 && handleStar(+star).map((star, number) => {
                            return (
                                <span key={number}>{star}</span>
                            )
                        })}
                        {title}
                    </div>
                    <div className='w-[10%] flex justify-end'>
                        <BsBookmarkStarFill size={24} color='orange' />
                    </div>
                </div>
                <div className='my-2 flex flex-wrap items-center justify-between gap-2'>
                    <span className='font-bold flex-3 text-green-600  whitespace-nowrap overflow-hidden text-ellipsis'>{attributes?.price}</span>
                    <span className='flex-1'>{attributes?.acreage}</span>
                    <span className='flex-3 whitespace-nowrap overflow-hidden text-ellipsis'>
                        {shortAddress}
                    </span>
                </div>
                <p className='text-gray-500 w-full h-[50px] text-ellipsis overflow-hidden'>
                    {description}
                </p>
                <div className='flex flex-wrap items-center my-5 justify-between gap-3'>
                    <div className=' flex items-center'>
                        <img
                            src={avatarSource}
                            onError={event => {
                                event.currentTarget.onerror = null
                                event.currentTarget.src = anonAvatar
                            }}
                            alt="Ảnh đại diện người đăng"
                            className='w-[30px] h-[30px] object-cover rounded-full'
                        />
                        <p>{user?.name}</p>
                    </div>
                    <div className='flex items-center gap-1'>
                        <a
                            href={user?.phone ? `tel:${String(user.phone).replace(/[^\d+]/g, '')}` : undefined}
                            className='bg-blue-700 text-white p-1 rounded-md'
                        >
                            {`Gọi ${user?.phone}`}
                        </a>
                        <a
                            href={user?.zalo ? `https://zalo.me/${String(user.zalo).replace(/\D/g, '')}` : undefined}
                            target='_blank'
                            rel='noreferrer'
                            className='text-blue-700 px-1 rounded-md border border-blue-700'
                        >
                            Nhắn zalo
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(Item)