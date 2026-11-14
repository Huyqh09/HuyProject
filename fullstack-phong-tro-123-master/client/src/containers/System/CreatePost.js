import React, { useState } from 'react'
import { Overview, Address, Loading, Button } from '../../components'
import { apiUploadImages } from '../../services'
import icons from '../../ultils/icons'
import { getCodes, getCodesArea } from '../../ultils/Common/getCodes'
import { useDispatch, useSelector } from 'react-redux'
import { apiCreatePost, apiUpdatePost } from '../../services'
import Swal from 'sweetalert2'
import MapView from '../../components/MapView'
import { apiGeocodeAddress } from '../../services/post'
import parseJson from '../../ultils/parseJson'
import * as actions from '../../store/actions'

const { BsCameraFill, ImBin } = icons

const CreatePost = ({ isEdit, setIsEdit }) => {
const dispatch = useDispatch()
const { dataEdit } = useSelector(state => state.post)
const { currentData } = useSelector(state => state.user)
const { prices, areas, categories } = useSelector(state => state.app)
const postToEdit = isEdit ? dataEdit : {}
const parsedInitialImages = parseJson(postToEdit?.images?.image, [])
const initialImages = Array.isArray(parsedInitialImages) ? parsedInitialImages : []
const [payload, setPayload] = useState(()=>{
        const initData={
            categoryCode:postToEdit?.categoryCode||'',
            title:postToEdit?.title|| '',
            priceNumber:postToEdit?.priceNumber*1000000|| 0,
            areaNumber: postToEdit?.areaNumber||0,
            images: initialImages,
            address: postToEdit?.address || '',
            addressDetail: postToEdit?.address || '',
            priceCode: postToEdit?.priceCode || '',
            areaCode: postToEdit?.areaCode || '',
            description: parseJson(postToEdit?.description, postToEdit?.description || ''),
            target:postToEdit?.overviews?.target || '',
            province: postToEdit?.province||'',
            latitude: postToEdit?.latitude || null,
            longitude: postToEdit?.longitude || null,
            contactName: postToEdit?.user?.name || currentData?.name || '',
            contactPhone: postToEdit?.user?.phone || currentData?.phone || ''
        }
        return initData
    })
    const [imagesPreview, setImagesPreview] = useState(initialImages)
    const [isLoading, setIsLoading] = useState(false)
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const handleFiles = async (e) => {
        e.stopPropagation()
        setIsLoading(true)
        let images = []
        try {
            for (const file of e.target.files || []) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('upload_preset', process.env.REACT_APP_UPLOAD_ACCESS_NAME)
                const response = await apiUploadImages(formData)
                if (response.status === 200 && response.data?.secure_url) {
                    images = [...images, response.data.secure_url]
                }
            }
        } catch (error) {
            await Swal.fire('Không tải được ảnh', error.response?.data?.error?.message || error.message, 'error')
        } finally {
            e.target.value = ''
            setIsLoading(false)
        }
        setImagesPreview(prev => [...prev, ...images])
        setPayload(prev => ({ ...prev, images: [...(Array.isArray(prev.images) ? prev.images : []), ...images] }))
    }
    const handleDeleteImage = (image) => {
        setImagesPreview(prev => prev?.filter(item => item !== image))
        setPayload(prev => ({
            ...prev,
            images: prev.images?.filter(item => item !== image)
        }))
    }
    // const handleSubmit = () => {
    //     let priceCodeArr = getCodes([+payload.priceNumber, +payload.priceNumber], prices)
    //     console.log(priceCodeArr)
    //     let priceCode = priceCodeArr[priceCodeArr.length - 1]?.code
    //     console.log(priceCode)
    // }
    const handleSubmit = async () => {
        if (isSaving || isGeocoding) return
        if (!payload.categoryCode || !payload.title?.trim() || !payload.address?.trim()
            || !payload.contactName?.trim() || !payload.contactPhone?.trim()
            || Number(payload.priceNumber) <= 0 || Number(payload.areaNumber) <= 0) {
            await Swal.fire('Thiếu thông tin', 'Vui lòng điền loại tin, tiêu đề, địa chỉ, thông tin liên hệ, giá và diện tích.', 'warning')
            return
        }

        let priceCodeArr = getCodes(+payload.priceNumber/Math.pow(10,6),prices,1,15)
        let priceCode = priceCodeArr[priceCodeArr.length - 1]?.code
        let areaCodeArr = getCodesArea(+payload.areaNumber,areas,0,90)
        let areaCode = areaCodeArr[0]?.code
        
        let finalPayload = {
            ...payload,
            priceCode,
            areaCode,
            priceNumber: +payload.priceNumber/Math.pow(10,6),
            target : payload.target || 'Tất Cả',
            category: categories?.find(item => item.code === payload?.categoryCode)?.value || '',
            label: `${categories?.find(item => item.code === payload?.categoryCode)?.value || ''} ${payload?.address?.split(',')[0]}`
        }

        setIsSaving(true)
        try {
            if (finalPayload.latitude == null || finalPayload.longitude == null) {
                // Geocoding is best-effort: if the lookup service is unreachable or finds
                // nothing, still save the post without coordinates instead of blocking it.
                setIsGeocoding(true)
                try {
                    const geocodeResponse = await apiGeocodeAddress(payload.address)
                    if (geocodeResponse.data.response) {
                        finalPayload.latitude = geocodeResponse.data.response.latitude
                        finalPayload.longitude = geocodeResponse.data.response.longitude
                    }
                } catch (geocodeError) {
                    console.warn('Geocoding failed, saving post without coordinates:', geocodeError.response?.data?.msg || geocodeError.message)
                }
                setIsGeocoding(false)
            }

            const response = isEdit
                ? await apiUpdatePost(postToEdit.id, finalPayload)
                : await apiCreatePost(finalPayload)
            if (response?.data.err === 0) {
                await Swal.fire(
                    'Thành công',
                    isEdit ? 'Tin đăng đã được cập nhật.' : 'Đã thêm bài đăng mới.',
                    'success'
                )
                dispatch(actions.getCurrent())
                if (isEdit) {
                    dispatch(actions.getPostsLimitAdmin())
                    setIsEdit?.(false)
                    return
                }
                setPayload({
                    categoryCode: '',
                    title: '',
                    priceNumber: 0,
                    areaNumber: 0,
                    images: [],
                    address: '',
                    priceCode: '',
                    areaCode: '',
                    description: '',
                    target: '',
                    province: '',
                    latitude: null,
                    longitude: null,
                    contactName: currentData?.name || '',
                    contactPhone: currentData?.phone || ''
                })
                setImagesPreview([])
            } else {
                await Swal.fire('Không thể lưu tin', response?.data?.msg || 'Vui lòng thử lại.', 'error')
            }
        } catch (error) {
            await Swal.fire('Không thể lưu tin', error.response?.data?.msg || error.message || 'Vui lòng thử lại.', 'error')
        } finally {
            setIsGeocoding(false)
            setIsSaving(false)
        }
    }
    return (
        <div className='px-6'>
            <h1 className='text-3xl font-medium py-4 border-b border-gray-200'>{isEdit?'Chỉnh sửa tin đăng':'Đăng tin mới'}</h1>
            <div className='flex flex-col gap-4 lg:flex-row'>
                <div className='py-4 flex flex-col gap-8 flex-auto'>
                    <Address payload={payload} setPayload={setPayload} />
                    <Overview payload={payload} setPayload={setPayload} />
                    <div className='w-full mb-6'>
                        <h2 className='font-semibold text-xl py-4'>Hình ảnh</h2>
                        <small>Cập nhật hình ảnh rõ ràng sẽ cho thuê nhanh hơn</small>
                        <div className='w-full'>
                            <label className='w-full border-2 h-[200px] my-4 gap-4 flex flex-col items-center justify-center border-gray-400 border-dashed rounded-md' htmlFor="file">
                                {isLoading
                                    ? <Loading />
                                    : <div className='flex flex-col items-center justify-center'>
                                        <BsCameraFill color='blue' size={50} />
                                        Thêm ảnh
                                    </div>}
                            </label>
                            <input onChange={handleFiles} hidden type="file" id='file' multiple />
                            <div className='w-full'>
                                <h3 className='font-medium py-4'>Ảnh đã chọn</h3>
                                <div className='flex gap-4 items-center'>
                                    {imagesPreview?.map(item => {
                                        return (
                                            <div key={item} className='relative w-1/3 h-1/3 '>
                                                <img src={item} alt="preview" className='w-full h-full object-cover rounded-md' />
                                                <span
                                                    title='Xóa'
                                                    onClick={() => handleDeleteImage(item)}
                                                    className='absolute top-0 right-0 p-2 cursor-pointer bg-gray-300 hover:bg-gray-400 rounded-full'
                                                >
                                                    <ImBin />
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        text={isGeocoding ? 'Đang định vị…' : isSaving ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo mới'}
                        bgColor='bg-green-600'
                        textColor='text-white'
                    />
                </div>
                <div className='w-full flex-none pt-4 lg:w-[35%]'>
                    <h2 className="mb-2 font-semibold">Vị trí trên bản đồ</h2>
                    <p className="mb-2 text-sm text-gray-600">Bấm vào bản đồ để ghim vị trí chính xác, hoặc lưu tin để thử định vị từ địa chỉ.</p>
                    <MapView
                        center={payload.latitude && payload.longitude ? { latitude: payload.latitude, longitude: payload.longitude } : undefined}
                        onPick={coordinates => setPayload(previous => ({ ...previous, ...coordinates }))}
                        height={360}
                    />
                    <div className="mt-2 text-sm text-gray-600">
                        {payload.latitude && payload.longitude
                            ? `Tọa độ: ${Number(payload.latitude).toFixed(5)}, ${Number(payload.longitude).toFixed(5)}`
                            : 'Chưa chọn tọa độ; hệ thống sẽ thử định vị theo địa chỉ khi lưu.'}
                    </div>
                    {isGeocoding && <p className="mt-2 text-sm">Đang tìm vị trí…</p>}
                </div>
            </div>
        </div>
    )
}

export default CreatePost