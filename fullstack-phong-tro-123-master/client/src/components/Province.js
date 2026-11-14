import React from 'react'
import { ProvinceBtn } from './index'
import { location } from '../ultils/constant'

const Province = () => {
    return (
        <div className='grid w-full grid-cols-1 sm:grid-cols-3 gap-4 py-5'>
            {location.map(item => {
                return (
                    <ProvinceBtn
                        key={item.id}
                        image={item.image}
                        name={item.name}
                        provinceCode={item.provinceCode}
                    />
                )
            })}
        </div>
    )
}

export default Province