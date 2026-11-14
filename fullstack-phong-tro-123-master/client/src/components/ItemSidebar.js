import React, { memo } from 'react'
import icons from '../ultils/icons'
import { formatVietnameseToString } from '../ultils/Common/formatVietnameseToString'
import { Link } from 'react-router-dom'
import { useLocation, useNavigate } from "react-router-dom";

const { GrNext } = icons

const ItemSidebar = ({ title, content, isDouble, type }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const selectedCode = new URLSearchParams(location.search).get(type)

    const handleFilterPosts = (code) => {
        const params = new URLSearchParams(location.search)
        if (params.get(type) === code) {
            params.delete(type)
        } else {
            params.set(type, code)
        }
        params.delete('page')
        navigate({
            pathname: location.pathname,
            search: params.toString()
        });
    }


    return (
        <div className='p-4 rounded-md bg-white w-full'>
            <h3 className='text-lg font-semibold mb-4'>{title}</h3>
            {!isDouble && <div className='flex flex-col gap-2' >
                {content?.length > 0 && content.map(item => {
                    return (
                        <Link
                            to={`/${formatVietnameseToString(item.value)}`}
                            key={item.code}
                            className='flex gap-2 items-center cursor-pointer hover:text-orange-600 border-b border-gray-200 pb-1 border-dashed'
                        >
                            <GrNext size={10} color='#ccc' />
                            <p>{item.value}</p>
                        </Link>
                    )
                })}
            </div>}
            {isDouble && <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2' >
                {content?.length > 0 && content.map(item => {
                    const isSelected = selectedCode === item.code
                    return (
                        <button
                            type='button'
                            key={item.code}
                            onClick={() => handleFilterPosts(item.code)}
                            aria-pressed={isSelected}
                            className={`flex gap-2 items-center cursor-pointer border-b border-gray-200 pb-1 border-dashed text-left transition-colors ${
                                isSelected ? 'text-orange-700 font-semibold' : 'text-gray-700 hover:text-orange-600'
                            }`}
                        >
                            <span
                                aria-hidden='true'
                                className={`w-5 h-5 flex-none rounded border flex items-center justify-center ${
                                    isSelected ? 'border-orange-600 bg-orange-600 text-white' : 'border-gray-400 bg-white'
                                }`}
                            >
                                {isSelected
                                    ? <svg viewBox='0 0 16 16' className='w-3 h-3' fill='none' stroke='currentColor' strokeWidth='2.5'><path d='m3 8 3 3 7-7' /></svg>
                                    : <GrNext size={9} color='#999' />}
                            </span>
                            <span>{item.value}</span>
                        </button>
                    )
                })}
            </div>}
            {isDouble && selectedCode && (
                <p className='mt-3 text-xs text-orange-700' role='status'>
                    Đang chọn: {content?.find(item => item.code === selectedCode)?.value || selectedCode}. Nhấn lại để bỏ chọn.
                </p>
            )}
        </div>
    )
}

export default memo(ItemSidebar)