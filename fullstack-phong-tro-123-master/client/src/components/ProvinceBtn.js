import React, { memo } from 'react'
import { useNavigate } from 'react-router-dom'

const ProvinceBtn = ({ name, image, provinceCode }) => {
    const navigate = useNavigate()

    return (
        <button
            type='button'
            onClick={() => navigate(`/?provinceCode=${encodeURIComponent(provinceCode)}`)}
            className='w-full shadow-md rounded-bl-md text-blue-700 rounded-br-md cursor-pointer hover:text-orange-600 text-left'
        >
            <img
                src={image}
                alt={name}
                className='w-full h-36 sm:h-28 object-cover rounded-tl-md rounded-tr-md'
            />
            <div className='font-medium p-2 text-center'>{name}</div>
        </button>
    )
}

export default memo(ProvinceBtn)