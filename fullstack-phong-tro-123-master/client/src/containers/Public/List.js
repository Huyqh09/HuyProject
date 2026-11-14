import React, { useEffect } from 'react'
import { Button, Item } from '../../components'
import { getPostsLimit } from '../../store/actions/post'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import parseJson from '../../ultils/parseJson'

const List = ({ categoryCode }) => {
    const dispatch = useDispatch()
    const [searchParams, setSearchParams] = useSearchParams()
    const { posts, msg } = useSelector(state => state.post)
    const queryString = searchParams.toString()

    useEffect(() => {
        const query = Object.fromEntries(new URLSearchParams(queryString).entries())
        if (categoryCode) query.categoryCode = categoryCode
        dispatch(getPostsLimit(query))
    }, [dispatch, queryString, categoryCode])

    const changeSort = sort => {
        const params = new URLSearchParams(searchParams)
        params.set('sort', sort)
        params.delete('page')
        setSearchParams(params)
    }

    const selectedSort = searchParams.get('sort') || 'recommended'

    return (
        <div className='w-full min-w-0 p-2 bg-white shadow-md rounded-md px-3 sm:px-6'>
            <div className='flex flex-wrap items-center justify-between gap-2 my-3'>
                <h4 className='text-xl font-semibold'>Danh sách tin đăng</h4>
                <span className='text-sm text-gray-500'>Tin cho thuê phòng trọ</span>
            </div>
            <div className='flex flex-wrap items-center gap-2 my-2'>
                <span>Sắp xếp:</span>
                <Button
                    bgColor={selectedSort === 'recommended' ? 'bg-orange-100' : 'bg-gray-200'}
                    text='Mặc định'
                    onClick={() => changeSort('recommended')}
                />
                <Button
                    bgColor={selectedSort === 'newest' ? 'bg-orange-100' : 'bg-gray-200'}
                    text='Mới nhất'
                    onClick={() => changeSort('newest')}
                />
            </div>
            {msg && <p role='alert' className='my-3 text-sm text-red-600'>{msg}</p>}
            <div className='items'>
                {posts?.length > 0 && posts.map(item => {
                    return (
                        <Item
                            key={item?.id}
                            address={item?.address}
                            attributes={item?.attributes}
                            description={parseJson(item?.description, [])}
                            images={parseJson(item?.images?.image, [])}
                            star={+item?.star}
                            title={item?.title}
                            user={item?.user}
                            id={item?.id}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export default List