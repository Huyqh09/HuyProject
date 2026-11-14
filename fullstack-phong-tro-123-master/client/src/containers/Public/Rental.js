import React, { useState, useEffect } from 'react'
import { text } from '../../ultils/constant'
import { Province, ItemSidebar, RelatedPost } from '../../components'
import { List, Pagination } from './index'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { formatVietnameseToString } from '../../ultils/Common/formatVietnameseToString'

const Rental = () => {
    const { prices, areas, categories } = useSelector(state => state.app)
    const [categoryCurrent, setCategoryCurrent] = useState({})
    const [categoryCode, setCategoryCode] = useState('none')
    const location = useLocation()
    useEffect(() => {
        const category = categories?.find(item => `/${formatVietnameseToString(item.value)}` === location.pathname)
        setCategoryCurrent(category)
        if (category) {
            setCategoryCode(category.code)
        }
    }, [categories, location.pathname])

    return (
        <div className='w-full min-w-0 flex flex-col gap-3' >
            <div>
                <h1 className='text-[28px] font-bold' >{categoryCurrent?.header}</h1>
                <p className='text-base text-gray-700'>{categoryCurrent?.subheader}</p>
            </div>
            <Province />
            <div className='w-full grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(260px,3fr)] gap-4'>
                <div className='min-w-0'>
                    <List categoryCode={categoryCode} />
                    <Pagination />
                </div>
                <div className='min-w-0 flex flex-col gap-4 justify-start items-center'>
                    <ItemSidebar isDouble={true} type='priceCode' content={prices} title='Xem theo giá' />
                    <ItemSidebar isDouble={true} type='areaCode' content={areas} title='Xem theo diện tích' />
                    <RelatedPost />
                </div>
            </div>

        </div>
    )
}

export default Rental