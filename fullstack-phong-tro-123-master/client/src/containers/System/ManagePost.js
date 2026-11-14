
import React, { useEffect,useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import parseJson from '../../ultils/parseJson'
import * as actions from '../../store/actions'
import moment from"moment"
import {Button,UpdatePost} from '../../components'
import { apiDeleteMyPost } from '../../services/post'
import Swal from 'sweetalert2'

const ManagePost = () => {
  const dispatch = useDispatch()
  const[isEdit,setIsEdit] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const { postOfCurrent } = useSelector(state => state.post)

    useEffect(() => {
        dispatch(actions.getPostsLimitAdmin())
    }, [])
    const getStatus = post => {
      const expiryDate = String(post?.overviews?.expired || '').match(/\d{1,2}\/\d{1,2}\/\d{4}/)?.[0]
      if (!expiryDate) return 'unknown'
      return moment(expiryDate, 'D/M/YYYY', true).endOf('day').isSameOrAfter(moment())
        ? 'active'
        : 'expired'
    }
    const posts = (Array.isArray(postOfCurrent) ? postOfCurrent : []).filter(post => (
      !statusFilter || getStatus(post) === statusFilter
    ))
      const handleDelete = async post => {
        const confirmation = await Swal.fire({
          title: 'Xóa tin đăng này?',
          text: 'Tin đăng và thông tin liên quan sẽ bị xóa.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Xóa tin',
          cancelButtonText: 'Hủy'
        })
        if (!confirmation.isConfirmed) return

        try {
          const response = await apiDeleteMyPost(post.id)
          if (response?.data?.err !== 0) {
            throw new Error(response?.data?.msg || 'Không thể xóa tin đăng.')
          }
          await dispatch(actions.getPostsLimitAdmin())
          await Swal.fire('Đã xóa', 'Tin đăng đã được xóa.', 'success')
        } catch (error) {
          await Swal.fire('Không thể xóa tin', error.response?.data?.msg || error.message, 'error')
        }
      }
    const statusLabels = {
      active: 'Đang hoạt động',
      expired: 'Đã hết hạn',
      unknown: 'Chưa xác định'
    }
  return (
    <div className='flex flex-col gap-6 '>
      <div className='py-4 border-b border-gray-200 flex items-center justify-between'> 
      <h1 className='text-3xl font-medium'>Quản lý tin đăng</h1> 
        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className='outline-none border p-2 border-gray-200 rounded-md'
        >
          <option value=''>Tất cả trạng thái</option>
          <option value='active'>Đang hoạt động</option>
          <option value='expired'>Đã hết hạn</option>
          <option value='unknown'>Chưa xác định</option>
        </select> 
      </div>
      <table className="w-full table-auto">
        <thead >
          <tr className='flex w-full' >
            <th className='border flex-1 p-2'>Mã tin</th>
            <th className='border flex-1 p-2'>Ảnh đại diện</th>
            <th className='border flex-1 p-2'>Tiêu đề</th>
            <th className='border flex-1 p-2'>Giá</th>
            <th className='border flex-1 p-2'>Ngày bắt đầu</th>
            <th className='border flex-1 p-2'>Ngày hết hạn</th>
            <th className='border flex-1 p-2'>Trạng thái</th>
            <th className='border flex-1 p-2'>Tùy chọn</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0
            ? <tr><td className='p-4 text-center' colSpan='8'>Không có tin đăng phù hợp.</td></tr>
            : posts.map(item=>{
              return (
                <tr className='flex items-center h-16' key={item.id}>
                  <td className='border px-2 flex-1 h-full flex justify-center items-center'>{item?.overviews?.code}</td>
                  <td className='border px-2 flex-1 h-full flex items-center justify-center'>
                    <img src={parseJson(item?.images?.image, [])[0] || ''} alt='avatar-post' className='w-10 h-10 object-cover rounded-md' />
                  </td>
                  <td className='border px-2 flex-1 h-full flex justify-center items-center'>{`${item?.title?.slice(0, 40)}...`}</td>
                  <td className='border px-2 flex-1 h-full flex justify-center items-center'>{item?.attributes?.price}</td>
                  <td className='border px-2 flex-1 h-full flex justify-center items-center'>{item?.overviews?.created}</td>
                  <td className='border px-2 flex-1 h-full flex justify-center items-center'>{item?.overviews?.expired}</td>
                  <td className='border px-2 flex-1 h-full flex justify-center items-center'>
                    {statusLabels[getStatus(item)]}
                  </td>
                  <td className='border px-2 flex-1 h-full flex items-center justify-center gap-4'>
                    <Button
                      text='Sửa'
                      bgColor='bg-green-600'
                      textColor='text-white'
                      onClick={()=>{
                        dispatch(actions.editData(item))
                        setIsEdit(true)
                      }}
                    />
                    <Button
                      text='Xóa'
                      bgColor='bg-orange-600'
                      textColor='text-white'
                      onClick={() => handleDelete(item)}
                    />
                  </td>
                </tr>
              );
              
            })
          }
        </tbody>
      </table>
      {isEdit && <UpdatePost setIsEdit={setIsEdit} />}
    </div>
  )
}

export default ManagePost